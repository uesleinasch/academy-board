import { useCallback, useEffect, useRef, useState } from 'react'
import { CaptureUpdateAction } from '@excalidraw/excalidraw'
import type { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types'
import type { OrderedExcalidrawElement } from '@excalidraw/excalidraw/element/types'
import type { DocumentoCarregado, Rascunho } from '@shared/tipos'
import { api } from '../ipc/api'
import { interpretar, serializar } from './serializacao'
import { usarDocumento } from './usarDocumento'
import { calcularVersao } from './versaoCena'

const ESPERA_RASCUNHO_MS = 2000

export function usarCicloDeDocumento(
  excalidraw: ExcalidrawImperativeAPI | null,
  hidratarBiblioteca: (conteudoJson: string) => void
) {
  const [erro, setErro] = useState<string | null>(null)
  const [rascunho, setRascunho] = useState<Rascunho | null>(null)
  const rascunhoPendente = useRef(false)
  const temporizadorRascunho = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inicializado = useRef(false)
  const documento = usarDocumento()

  const mostrarRascunho = useCallback((valor: Rascunho | null) => {
    rascunhoPendente.current = valor !== null
    setRascunho(valor)
  }, [])

  const cancelarRascunho = useCallback(() => {
    if (temporizadorRascunho.current) clearTimeout(temporizadorRascunho.current)
    temporizadorRascunho.current = null
  }, [])

  const versaoDaCena = useCallback(
    () => calcularVersao(excalidraw?.getSceneElementsIncludingDeleted() ?? []),
    [excalidraw]
  )

  const serializarCena = useCallback(
    (quadro: ExcalidrawImperativeAPI) =>
      serializar(quadro.getSceneElements(), quadro.getAppState(), quadro.getFiles()),
    []
  )

  const carregar = useCallback(
    (alvo: DocumentoCarregado, tipo: 'carregado' | 'recuperado'): boolean => {
      if (!excalidraw) return false
      let dados: ReturnType<typeof interpretar>
      try {
        dados = interpretar(alvo.conteudoJson, excalidraw.getAppState())
      } catch {
        setErro('o desenho não pôde ser interpretado')
        return false
      }
      cancelarRascunho()
      excalidraw.updateScene({
        elements: dados.elements,
        appState: dados.appState,
        captureUpdate: CaptureUpdateAction.NEVER
      })
      excalidraw.addFiles(Object.values(dados.files))
      excalidraw.history.clear()
      excalidraw.scrollToContent(undefined, { fitToContent: true, animate: false })
      documento.aplicar({ tipo, caminho: alvo.caminho, versao: versaoDaCena() })
      return true
    },
    [excalidraw, documento, cancelarRascunho, versaoDaCena]
  )

  const resetar = useCallback(() => {
    if (!excalidraw) return
    cancelarRascunho()
    excalidraw.resetScene()
    excalidraw.history.clear()
    documento.aplicar({ tipo: 'carregado', caminho: null, versao: versaoDaCena() })
  }, [excalidraw, documento, cancelarRascunho, versaoDaCena])

  const salvar = useCallback(
    async (comoNovo: boolean): Promise<boolean> => {
      if (!excalidraw) return false
      const versao = versaoDaCena()
      const conteudoJson = serializarCena(excalidraw)
      const caminho = documento.caminho()
      const resultado =
        caminho && !comoNovo
          ? await api.gravar({ caminho, conteudoJson })
          : await api.gravarComo({ conteudoJson })
      if (!resultado.ok) {
        if (resultado.erro) setErro(resultado.erro)
        return false
      }
      cancelarRascunho()
      documento.aplicar({ tipo: 'salvo', caminho: resultado.caminho, versao })
      return true
    },
    [excalidraw, documento, cancelarRascunho, serializarCena, versaoDaCena]
  )

  const agendarRascunho = useCallback(() => {
    cancelarRascunho()
    temporizadorRascunho.current = setTimeout(() => {
      temporizadorRascunho.current = null
      if (!excalidraw || !documento.sujo() || rascunhoPendente.current) return
      api.salvarRascunho({
        caminhoOriginal: documento.caminho(),
        conteudoJson: serializarCena(excalidraw)
      })
    }, ESPERA_RASCUNHO_MS)
  }, [excalidraw, documento, cancelarRascunho, serializarCena])

  const aoMudar = useCallback(
    (elementos: readonly OrderedExcalidrawElement[]) => {
      documento.aplicar({ tipo: 'alterado', versao: calcularVersao(elementos) })
      if (documento.sujo() && !rascunhoPendente.current) agendarRascunho()
    },
    [documento, agendarRascunho]
  )

  useEffect(() => {
    if (!excalidraw || inicializado.current) return
    inicializado.current = true
    void api.estadoInicial().then((inicial) => {
      if (inicial.documento) carregar(inicial.documento, 'carregado')
      if (inicial.bibliotecaJson) hidratarBiblioteca(inicial.bibliotecaJson)
      mostrarRascunho(inicial.rascunho)
    })
  }, [excalidraw, carregar, hidratarBiblioteca, mostrarRascunho])

  useEffect(() => {
    const cancelar = [
      api.aoCarregarDocumento((alvo) => {
        mostrarRascunho(null)
        carregar(alvo, 'carregado')
      }),
      api.aoResetarDocumento(() => {
        mostrarRascunho(null)
        resetar()
      }),
      api.aoErro(setErro),
      api.aoPedirSalvar(() => void salvar(false)),
      api.aoPedirSalvarComo(() => void salvar(true)),
      api.aoPedirSalvarAgora((id) => {
        void salvar(false).then((ok) => api.responderSalvarAgora(id, ok))
      })
    ]
    return () => cancelar.forEach((fn) => fn())
  }, [carregar, resetar, salvar, mostrarRascunho])

  const recuperarRascunho = useCallback(() => {
    if (!rascunho) return
    const alvo = { caminho: rascunho.caminhoOriginal, conteudoJson: rascunho.conteudoJson }
    if (!carregar(alvo, 'recuperado')) return
    mostrarRascunho(null)
    api.assumirRascunho()
  }, [rascunho, carregar, mostrarRascunho])

  const descartarRascunho = useCallback(() => {
    mostrarRascunho(null)
    void api.descartarRascunho()
  }, [mostrarRascunho])

  const limparErro = useCallback(() => setErro(null), [])

  return { erro, limparErro, rascunho, recuperarRascunho, descartarRascunho, aoMudar }
}

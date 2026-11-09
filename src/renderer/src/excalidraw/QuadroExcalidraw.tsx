import { Excalidraw, THEME } from '@excalidraw/excalidraw'
import type { AppState, ExcalidrawImperativeAPI, LibraryItems } from '@excalidraw/excalidraw/types'
import type { OrderedExcalidrawElement, Theme } from '@excalidraw/excalidraw/element/types'
import { useCallback, useMemo, useRef } from 'react'
import { aguardarInicializacao } from './aguardarInicializacao'
import { OPCOES_UI } from './opcoesUi'

const CHAVE_TEMA = 'academy-board:tema'

function lerTema(): Theme {
  try {
    return localStorage.getItem(CHAVE_TEMA) === THEME.LIGHT ? THEME.LIGHT : THEME.DARK
  } catch {
    return THEME.DARK
  }
}

function guardarTema(tema: Theme): void {
  try {
    localStorage.setItem(CHAVE_TEMA, tema)
  } catch {
    return
  }
}

interface Props {
  apresentando: boolean
  aoPronto: (api: ExcalidrawImperativeAPI) => void
  aoMudar: (elementos: readonly OrderedExcalidrawElement[]) => void
  aoMudarBiblioteca: (itens: LibraryItems) => void
}

export function QuadroExcalidraw({ apresentando, aoPronto, aoMudar, aoMudarBiblioteca }: Props) {
  const temaInicial = useMemo(lerTema, [])
  const temaAtual = useRef(temaInicial)

  const aoMudarCena = useCallback(
    (elementos: readonly OrderedExcalidrawElement[], appState: AppState) => {
      if (appState.theme !== temaAtual.current) {
        temaAtual.current = appState.theme
        guardarTema(appState.theme)
      }
      aoMudar(elementos)
    },
    [aoMudar]
  )

  const aoReceberApi = useCallback(
    (api: ExcalidrawImperativeAPI) => aguardarInicializacao(api, aoPronto),
    [aoPronto]
  )

  return (
    <div className={apresentando ? 'quadro quadro--apresentando' : 'quadro'}>
      <Excalidraw
        excalidrawAPI={aoReceberApi}
        initialData={{ appState: { theme: temaInicial } }}
        onChange={aoMudarCena}
        onLibraryChange={aoMudarBiblioteca}
        zenModeEnabled={apresentando}
        UIOptions={OPCOES_UI}
        langCode="pt-BR"
        autoFocus
      />
    </div>
  )
}

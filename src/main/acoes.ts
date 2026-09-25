import { basename, dirname, join } from 'node:path'
import { dialog } from 'electron'
import type Store from 'electron-store'
import { CANAIS } from '@shared/canais-ipc'
import type {
  DocumentoCarregado,
  PedidoGravacao,
  PedidoGravacaoComo,
  ResultadoGravacao
} from '@shared/tipos'
import type { EsquemaPersistido } from './armazenamento'
import { comExtensao, gravarAtomico, lerDocumento, mensagem } from './arquivos'
import { lerBibliotecaImportada } from './biblioteca'
import { EXTENSAO_BIBLIOTECA, EXTENSAO_DOCUMENTO } from './constantes'
import type { EspelhoDocumento } from './documento-estado'
import type { JanelaBoard } from './janela'
import type { Rascunhos } from './rascunho'
import { incluirRecente, removerRecente } from './recentes'

interface Dependencias {
  armazenamento: Store<EsquemaPersistido>
  espelho: EspelhoDocumento
  rascunhos: Rascunhos
  janela: () => JanelaBoard | null
  aoMudarRecentes: () => void
}

const FILTRO_DOCUMENTO = { name: 'Desenho do Excalidraw', extensions: [EXTENSAO_DOCUMENTO] }
const FILTRO_BIBLIOTECA = { name: 'Biblioteca do Excalidraw', extensions: [EXTENSAO_BIBLIOTECA] }

export function criarAcoes({ armazenamento, espelho, rascunhos, janela, aoMudarRecentes }: Dependencias) {
  function pastaInicial(): string | undefined {
    return armazenamento.get('ultimaPasta') ?? undefined
  }

  function registrarUso(caminho: string): void {
    armazenamento.set('ultimoArquivo', caminho)
    armazenamento.set('ultimaPasta', dirname(caminho))
    armazenamento.set('recentes', incluirRecente(armazenamento.get('recentes'), caminho))
    aoMudarRecentes()
  }

  function esquecer(caminho: string): void {
    armazenamento.set('recentes', removerRecente(armazenamento.get('recentes'), caminho))
    if (armazenamento.get('ultimoArquivo') === caminho) armazenamento.set('ultimoArquivo', null)
    aoMudarRecentes()
  }

  function definirDocumento(caminho: string | null): void {
    espelho.definir({ caminho, sujo: false })
    janela()?.atualizarTitulo()
  }

  async function carregarDoDisco(caminho: string): Promise<DocumentoCarregado | null> {
    const leitura = await lerDocumento(caminho)
    if (!leitura.ok) {
      esquecer(caminho)
      janela()?.enviar(CANAIS.documentoErro, leitura.erro)
      return null
    }
    return { caminho, conteudoJson: leitura.conteudoJson }
  }

  async function carregarEAplicar(alvo: JanelaBoard, caminho: string): Promise<void> {
    const documento = await carregarDoDisco(caminho)
    if (!documento) return
    await rascunhos.apagar()
    alvo.enviar(CANAIS.documentoCarregado, documento)
    definirDocumento(caminho)
    registrarUso(caminho)
  }

  async function abrirCaminho(caminho: string): Promise<void> {
    const alvo = janela()
    if (!alvo || !(await alvo.confirmarSeSujo())) return
    await carregarEAplicar(alvo, caminho)
  }

  async function abrirComDialogo(): Promise<void> {
    const alvo = janela()
    if (!alvo || !(await alvo.confirmarSeSujo())) return
    const { canceled, filePaths } = await dialog.showOpenDialog(alvo.janela, {
      title: 'Abrir desenho',
      defaultPath: pastaInicial(),
      properties: ['openFile'],
      filters: [FILTRO_DOCUMENTO]
    })
    if (canceled || !filePaths[0]) return
    await carregarEAplicar(alvo, filePaths[0])
  }

  async function novo(): Promise<void> {
    const alvo = janela()
    if (!alvo || !(await alvo.confirmarSeSujo())) return
    await rascunhos.apagar()
    alvo.enviar(CANAIS.documentoResetado)
    definirDocumento(null)
    armazenamento.set('ultimoArquivo', null)
  }

  async function gravar({ caminho, conteudoJson }: PedidoGravacao): Promise<ResultadoGravacao> {
    try {
      await gravarAtomico(caminho, conteudoJson)
    } catch (erro) {
      return { ok: false, erro: `não foi possível salvar: ${mensagem(erro)}` }
    }
    if (!rascunhos.pendente()) await rascunhos.apagar()
    definirDocumento(caminho)
    registrarUso(caminho)
    return { ok: true, caminho }
  }

  async function gravarComo({ conteudoJson }: PedidoGravacaoComo): Promise<ResultadoGravacao> {
    const alvo = janela()
    if (!alvo) return { ok: false, erro: null }
    const atual = espelho.atual().caminho
    const pasta = atual ? dirname(atual) : pastaInicial()
    const nome = atual ? basename(atual) : comExtensao('desenho')
    const { canceled, filePath } = await dialog.showSaveDialog(alvo.janela, {
      title: 'Salvar desenho',
      defaultPath: pasta ? join(pasta, nome) : nome,
      filters: [FILTRO_DOCUMENTO],
      properties: ['showOverwriteConfirmation', 'createDirectory']
    })
    if (canceled || !filePath) return { ok: false, erro: null }
    return gravar({ caminho: comExtensao(filePath), conteudoJson })
  }

  async function importarBiblioteca(): Promise<void> {
    const alvo = janela()
    if (!alvo) return
    const { canceled, filePaths } = await dialog.showOpenDialog(alvo.janela, {
      title: 'Importar biblioteca',
      defaultPath: pastaInicial(),
      properties: ['openFile', 'multiSelections'],
      filters: [FILTRO_BIBLIOTECA]
    })
    if (canceled) return
    for (const caminho of filePaths) {
      try {
        alvo.enviar(CANAIS.bibliotecaImportada, await lerBibliotecaImportada(caminho))
      } catch (erro) {
        alvo.enviar(CANAIS.documentoErro, `não foi possível importar a biblioteca: ${mensagem(erro)}`)
      }
    }
  }

  return {
    abrirCaminho,
    abrirComDialogo,
    novo,
    gravar,
    gravarComo,
    importarBiblioteca,
    carregarDoDisco,
    definirDocumento,
    registrarUso,
    limparRecentes: () => {
      armazenamento.set('recentes', [])
      aoMudarRecentes()
    },
    salvar: () => janela()?.enviar(CANAIS.salvar),
    salvarComo: () => janela()?.enviar(CANAIS.salvarComo),
    alternarApresentacao: () => janela()?.enviar(CANAIS.apresentacaoAlternar)
  }
}

export type Acoes = ReturnType<typeof criarAcoes>

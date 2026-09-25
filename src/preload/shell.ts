import { contextBridge, ipcRenderer } from 'electron'
import { CANAIS } from '@shared/canais-ipc'
import type {
  DocumentoCarregado,
  EstadoInicial,
  MudancaSujo,
  PedidoGravacao,
  PedidoGravacaoComo,
  PedidoRascunho,
  ResultadoGravacao
} from '@shared/tipos'

const api = {
  estadoInicial: (): Promise<EstadoInicial> => ipcRenderer.invoke(CANAIS.estadoInicial),
  gravar: (pedido: PedidoGravacao): Promise<ResultadoGravacao> =>
    ipcRenderer.invoke(CANAIS.gravar, pedido),
  gravarComo: (pedido: PedidoGravacaoComo): Promise<ResultadoGravacao> =>
    ipcRenderer.invoke(CANAIS.gravarComo, pedido),
  descartarRascunho: (): Promise<void> => ipcRenderer.invoke(CANAIS.rascunhoDescartar),
  assumirRascunho: (): void => ipcRenderer.send(CANAIS.rascunhoAssumido),

  informarSujo: (mudanca: MudancaSujo): void => ipcRenderer.send(CANAIS.sujoMudou, mudanca),
  salvarRascunho: (pedido: PedidoRascunho): void => ipcRenderer.send(CANAIS.rascunhoSalvar, pedido),
  persistirBiblioteca: (conteudoJson: string): void =>
    ipcRenderer.send(CANAIS.bibliotecaPersistir, conteudoJson),
  informarApresentacao: (apresentando: boolean): void =>
    ipcRenderer.send(CANAIS.apresentacaoMudou, apresentando),
  responderSalvarAgora: (id: string, ok: boolean): void =>
    ipcRenderer.send(CANAIS.salvarAgoraResposta, { id, ok }),

  aoCarregarDocumento: (cb: (documento: DocumentoCarregado) => void) =>
    ouvir(CANAIS.documentoCarregado, cb),
  aoResetarDocumento: (cb: () => void) => ouvir(CANAIS.documentoResetado, cb),
  aoErro: (cb: (mensagem: string) => void) => ouvir(CANAIS.documentoErro, cb),
  aoPedirSalvar: (cb: () => void) => ouvir(CANAIS.salvar, cb),
  aoPedirSalvarComo: (cb: () => void) => ouvir(CANAIS.salvarComo, cb),
  aoPedirSalvarAgora: (cb: (id: string) => void) => ouvir(CANAIS.salvarAgora, cb),
  aoImportarBiblioteca: (cb: (conteudoJson: string) => void) =>
    ouvir(CANAIS.bibliotecaImportada, cb),
  aoAlternarApresentacao: (cb: () => void) => ouvir(CANAIS.apresentacaoAlternar, cb)
}

function ouvir<T extends unknown[]>(canal: string, cb: (...args: T) => void): () => void {
  const ouvinte = (_evento: Electron.IpcRendererEvent, ...args: T): void => cb(...args)
  ipcRenderer.on(canal, ouvinte)
  return () => ipcRenderer.removeListener(canal, ouvinte)
}

contextBridge.exposeInMainWorld('api', api)

export type ApiBoard = typeof api

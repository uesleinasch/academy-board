import { randomUUID } from 'node:crypto'
import { join } from 'node:path'
import { BrowserWindow, dialog, ipcMain } from 'electron'
import type Store from 'electron-store'
import { CANAIS } from '@shared/canais-ipc'
import type { RespostaSalvarAgora } from '@shared/tipos'
import type { EsquemaPersistido } from './armazenamento'
import type { Rascunhos } from './rascunho'
import { PRAZO_SALVAR_AGORA_MS, TITULO_APP } from './constantes'
import { formatarTitulo, type EspelhoDocumento } from './documento-estado'
import { URL_APP } from './protocolo'
import { aplicarSeguranca } from './seguranca'

interface Dependencias {
  armazenamento: Store<EsquemaPersistido>
  espelho: EspelhoDocumento
  rascunhos: Rascunhos
}

export function criarJanela({ armazenamento, espelho, rascunhos }: Dependencias) {
  const salvos = armazenamento.get('limitesJanela')
  const urlDesenvolvimento = process.env['ELECTRON_RENDERER_URL']

  const janela = new BrowserWindow({
    title: TITULO_APP,
    width: salvos?.width ?? 1280,
    height: salvos?.height ?? 800,
    x: salvos?.x,
    y: salvos?.y,
    minWidth: 640,
    minHeight: 400,
    backgroundColor: '#121212',
    show: false,
    webPreferences: {
      preload: join(__dirname, '../preload/shell.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  })

  aplicarSeguranca(janela.webContents, urlDesenvolvimento)

  janela.on('page-title-updated', (evento) => evento.preventDefault())
  janela.once('ready-to-show', () => {
    if (salvos?.maximizada) janela.maximize()
    janela.show()
  })
  janela.on('resized', guardarLimites)
  janela.on('moved', guardarLimites)
  janela.on('maximize', guardarLimites)
  janela.on('unmaximize', guardarLimites)

  let fechando = false
  janela.on('close', (evento) => {
    if (fechando) return
    evento.preventDefault()
    void confirmarSeSujo().then(async (seguir) => {
      if (!seguir) return
      await rascunhos.apagar()
      fechando = true
      janela.close()
    })
  })

  void janela.loadURL(urlDesenvolvimento ?? URL_APP)

  function guardarLimites(): void {
    if (janela.isDestroyed()) return
    const { x, y, width, height } = janela.getNormalBounds()
    armazenamento.set('limitesJanela', { x, y, width, height, maximizada: janela.isMaximized() })
  }

  function atualizarTitulo(): void {
    if (!janela.isDestroyed()) janela.setTitle(formatarTitulo(espelho.atual()))
  }

  function enviar(canal: string, ...args: unknown[]): void {
    if (!janela.isDestroyed()) janela.webContents.send(canal, ...args)
  }

  let confirmando: Promise<boolean> | null = null

  function confirmarSeSujo(): Promise<boolean> {
    if (!espelho.atual().sujo && !rascunhos.pendente()) return Promise.resolve(true)
    confirmando ??= confirmarPendencias().finally(() => {
      confirmando = null
    })
    return confirmando
  }

  async function confirmarPendencias(): Promise<boolean> {
    if (espelho.atual().sujo && !(await perguntarSeSalva())) return false
    if (rascunhos.pendente() && !(await perguntarSeDescartaRascunho())) return false
    return true
  }

  async function perguntarSeDescartaRascunho(): Promise<boolean> {
    const { response } = await dialog.showMessageBox(janela, {
      type: 'warning',
      title: TITULO_APP,
      message: 'Descartar o rascunho não recuperado?',
      detail: 'O desenho da sessão anterior que não foi salvo será perdido.',
      buttons: ['Descartar rascunho', 'Cancelar'],
      defaultId: 1,
      cancelId: 1,
      noLink: true
    })
    return response === 0
  }

  async function perguntarSeSalva(): Promise<boolean> {
    const { response } = await dialog.showMessageBox(janela, {
      type: 'warning',
      title: TITULO_APP,
      message: 'Salvar as alterações do desenho?',
      detail: 'Se não salvar, as alterações serão perdidas.',
      buttons: ['Salvar', 'Não salvar', 'Cancelar'],
      defaultId: 0,
      cancelId: 2,
      noLink: true
    })
    if (response === 2) return false
    if (response === 1) return true
    return pedirSalvarAgora()
  }

  // Única ida main → renderer que espera resposta: só o renderer tem a cena para serializar.
  function pedirSalvarAgora(): Promise<boolean> {
    const id = randomUUID()
    return new Promise((resolver) => {
      const prazo = setTimeout(() => concluir(false), PRAZO_SALVAR_AGORA_MS)
      const ouvir = (_evento: Electron.IpcMainEvent, resposta: RespostaSalvarAgora): void => {
        if (resposta.id === id) concluir(resposta.ok)
      }
      function concluir(ok: boolean): void {
        clearTimeout(prazo)
        ipcMain.removeListener(CANAIS.salvarAgoraResposta, ouvir)
        resolver(ok)
      }
      ipcMain.on(CANAIS.salvarAgoraResposta, ouvir)
      enviar(CANAIS.salvarAgora, id)
    })
  }

  return { janela, atualizarTitulo, enviar, confirmarSeSujo }
}

export type JanelaBoard = ReturnType<typeof criarJanela>

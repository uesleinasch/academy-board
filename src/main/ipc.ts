import { ipcMain } from 'electron'
import type Store from 'electron-store'
import { CANAIS } from '@shared/canais-ipc'
import type {
  EstadoInicial,
  MudancaSujo,
  PedidoGravacao,
  PedidoGravacaoComo,
  PedidoRascunho
} from '@shared/tipos'
import type { Acoes } from './acoes'
import type { EsquemaPersistido } from './armazenamento'
import { caminhoDeArgv, mensagem } from './arquivos'
import type { Biblioteca } from './biblioteca'
import type { EspelhoDocumento } from './documento-estado'
import type { JanelaBoard } from './janela'
import type { Rascunhos } from './rascunho'

interface Dependencias {
  acoes: Acoes
  armazenamento: Store<EsquemaPersistido>
  espelho: EspelhoDocumento
  rascunhos: Rascunhos
  biblioteca: Biblioteca
  janela: () => JanelaBoard | null
}

export function registrarIpc(d: Dependencias): void {
  ipcMain.handle(CANAIS.estadoInicial, async (): Promise<EstadoInicial> => {
    const alvo = caminhoDeArgv(process.argv) ?? d.armazenamento.get('ultimoArquivo')
    const documento = alvo ? await d.acoes.carregarDoDisco(alvo) : null
    d.acoes.definirDocumento(documento?.caminho ?? null)
    if (documento?.caminho) d.acoes.registrarUso(documento.caminho)
    return {
      documento,
      rascunho: await d.rascunhos.lerParaRecuperar(),
      bibliotecaJson: await d.biblioteca.ler()
    }
  })

  ipcMain.handle(CANAIS.gravar, (_evento, pedido: PedidoGravacao) => d.acoes.gravar(pedido))
  ipcMain.handle(CANAIS.gravarComo, (_evento, pedido: PedidoGravacaoComo) => d.acoes.gravarComo(pedido))
  ipcMain.handle(CANAIS.rascunhoDescartar, () => d.rascunhos.apagar())

  ipcMain.on(CANAIS.sujoMudou, (_evento, mudanca: MudancaSujo) => {
    d.espelho.definir(mudanca)
    d.janela()?.atualizarTitulo()
  })

  ipcMain.on(CANAIS.rascunhoAssumido, () => d.rascunhos.assumir())

  ipcMain.on(CANAIS.rascunhoSalvar, (_evento, pedido: PedidoRascunho) => {
    d.rascunhos.gravar(pedido).catch((erro) => avisar(d, `rascunho não foi gravado: ${mensagem(erro)}`))
  })

  ipcMain.on(CANAIS.bibliotecaPersistir, (_evento, conteudoJson: string) => {
    d.biblioteca
      .gravar(conteudoJson)
      .catch((erro) => avisar(d, `biblioteca não foi gravada: ${mensagem(erro)}`))
  })

  ipcMain.on(CANAIS.apresentacaoMudou, (_evento, apresentando: boolean) => {
    d.janela()?.janela.setMenuBarVisibility(!apresentando)
  })
}

function avisar(d: Dependencias, texto: string): void {
  d.janela()?.enviar(CANAIS.documentoErro, texto)
}

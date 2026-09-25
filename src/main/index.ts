import { join } from 'node:path'
import { app, Menu } from 'electron'
import { criarAcoes } from './acoes'
import { criarArmazenamento } from './armazenamento'
import { caminhoDeArgv } from './arquivos'
import { criarBiblioteca } from './biblioteca'
import { criarEspelhoDocumento } from './documento-estado'
import { registrarIpc } from './ipc'
import { criarJanela, type JanelaBoard } from './janela'
import { montarMenu } from './menu'
import { registrarEsquema, servirRenderer } from './protocolo'
import { criarRascunhos } from './rascunho'

if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  let janela: JanelaBoard | null = null
  registrarEsquema()

  app.whenReady().then(() => {
    servirRenderer(join(__dirname, '../renderer'))
    const pastaDados = app.getPath('userData')
    const armazenamento = criarArmazenamento()
    const espelho = criarEspelhoDocumento()
    const rascunhos = criarRascunhos(pastaDados)
    const biblioteca = criarBiblioteca(pastaDados)

    const acoes = criarAcoes({
      armazenamento,
      espelho,
      rascunhos,
      janela: () => janela,
      aoMudarRecentes: () => Menu.setApplicationMenu(montarMenu(acoes, armazenamento.get('recentes')))
    })

    registrarIpc({ acoes, armazenamento, espelho, rascunhos, biblioteca, janela: () => janela })
    Menu.setApplicationMenu(montarMenu(acoes, armazenamento.get('recentes')))

    janela = criarJanela({ armazenamento, espelho, rascunhos })
    janela.atualizarTitulo()

    app.on('second-instance', (_evento, argv, pastaDeTrabalho) => {
      if (!janela) return
      if (janela.janela.isMinimized()) janela.janela.restore()
      janela.janela.focus()
      const caminho = caminhoDeArgv(argv, pastaDeTrabalho)
      if (caminho) void acoes.abrirCaminho(caminho)
    })
  })

  app.on('window-all-closed', () => app.quit())
}

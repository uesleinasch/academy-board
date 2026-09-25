import { basename } from 'node:path'
import { Menu, type MenuItemConstructorOptions } from 'electron'
import type { Acoes } from './acoes'

export function montarMenu(acoes: Acoes, recentes: readonly string[]): Menu {
  const itensRecentes: MenuItemConstructorOptions[] = recentes.length
    ? [
        ...recentes.map((caminho) => ({
          label: basename(caminho),
          sublabel: caminho,
          toolTip: caminho,
          click: () => void acoes.abrirCaminho(caminho)
        })),
        { type: 'separator' as const },
        { label: 'Limpar lista', click: () => acoes.limparRecentes() }
      ]
    : [{ label: 'Nenhum arquivo recente', enabled: false }]

  return Menu.buildFromTemplate([
    {
      label: '&Arquivo',
      submenu: [
        { label: 'Novo', accelerator: 'CmdOrCtrl+N', click: () => void acoes.novo() },
        { label: 'Abrir…', accelerator: 'CmdOrCtrl+O', click: () => void acoes.abrirComDialogo() },
        { label: 'Abrir recente', submenu: itensRecentes },
        { type: 'separator' },
        { label: 'Salvar', accelerator: 'CmdOrCtrl+S', click: acoes.salvar },
        { label: 'Salvar como…', accelerator: 'CmdOrCtrl+Shift+S', click: acoes.salvarComo },
        { type: 'separator' },
        { label: 'Importar biblioteca…', click: () => void acoes.importarBiblioteca() },
        { type: 'separator' },
        { label: 'Sair', accelerator: 'CmdOrCtrl+Q', role: 'quit' }
      ]
    },
    {
      label: '&Exibir',
      submenu: [
        { label: 'Modo apresentação', accelerator: 'F5', click: acoes.alternarApresentacao },
        { label: 'Tela cheia', role: 'togglefullscreen' },
        { type: 'separator' },
        { label: 'Ferramentas de desenvolvimento', role: 'toggleDevTools' }
      ]
    }
  ])
}

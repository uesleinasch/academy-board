# Academy Board

Quadro branco offline (Excalidraw em Electron) para desenhar diagramas durante as
aulas ao vivo, com os desenhos salvos como `.excalidraw` no disco e uma janela
estável para capturar no OBS.

Spec: [`docs/superpowers/specs/2026-09-25-academy-board-fase1-design.md`](docs/superpowers/specs/2026-09-25-academy-board-fase1-design.md)

## Rodar

```bash
npm install     # também copia as fontes do Excalidraw para src/renderer/public/fonts
npm run dev
npm test
npm run build   # typecheck + build em out/
npx electron . caminho/do/desenho.excalidraw   # abre o build num arquivo
```

## Instalar

```bash
make install     # empacota em ~/.local/opt/academy-board e integra ao GNOME
make uninstall
```

Instala o `.desktop`, os ícones e o tipo `.excalidraw`
(`application/vnd.excalidraw+json`), com o Board como app padrão: abre pelo
menu, pelo dock e por duplo clique no arquivo. Para levar a outra máquina:
`npm run dist` gera AppImage e `.deb` em `dist/`.

## Atalhos

| Ação | Atalho |
|---|---|
| Novo / Abrir / Salvar / Salvar como | Ctrl+N / Ctrl+O / Ctrl+S / Ctrl+Shift+S |
| Modo apresentação (esconde a interface) | F5 |
| Tela cheia | F11 |

No modo apresentação as ferramentas trocam pelo teclado do Excalidraw:
V seleção, R retângulo, O elipse, A seta, L linha, P lápis, T texto, E borracha,
K laser, H mão.

## OBS

Fonte **Captura de janela** → janela `Academy Board`, com *Prioridade de
correspondência* em **classe da janela** (`academy-board`). O título muda com o
nome do arquivo e com o `•` de alteração não salva; a classe não.

## Dados

`~/.config/academy-board/`: preferências (`academy-board.json`), rascunho de
recuperação (`rascunho.json`) e a biblioteca de formas (`biblioteca.excalidrawlib`).

# Academy Board — fase 1: quadro branco offline para desenhar na aula

- **Data:** 2026-09-25
- **Status:** aprovado; implementação autorizada
- **Escopo:** fase 1 (editor e arquivos). O AppImage tem tarefa própria.

## 1. Intenção

**O que o instrutor pediu**

- Um editor **Excalidraw offline** em **Electron**, vivendo em
  `Ferramentas/academy-board/`, para desenhar diagramas durante a aula sem abrir
  o navegador.
- Abrir e salvar arquivos `.excalidraw` no disco.
- Uma janela própria e estável para virar **cena fixa no OBS** (Window Capture),
  mais simples que capturar uma aba do navegador.

**Premissas assumidas (confirmadas nas perguntas)**

- Janela normal, com moldura e redimensionável; lembra posição e tamanho.
- Sem pasta padrão para desenhos: o diálogo sempre abre, na última pasta usada.
- Salvar é explícito (Ctrl+S); em paralelo há rascunho automático para recuperar
  após fechar ou travar.
- Stack do Teleprompter Show (electron-vite, React, TypeScript estrito,
  electron-store), mesmo autor e mesma máquina.

**Critério de sucesso**

Na aula, o instrutor abre o Board (ou um `.excalidraw` com duplo clique), desenha,
alterna para o modo apresentação com uma tecla e salva com Ctrl+S. O OBS
reencontra a janela pela classe `academy-board` em toda sessão, e nada sai da
máquina: zero requisição de rede.

## 2. Escopo

| Fase 1 (esta spec) | Fora desta spec |
|---|---|
| Novo, abrir, salvar, salvar como (Ctrl+N/O/S/Shift+S) | AppImage e .deb (tarefa #417) |
| Título com `•` quando há alteração não salva | Abrir o Board pelo Academy Dash |
| Confirmação ao fechar/novo/abrir com alterações | Colaboração ao vivo |
| Rascunho automático e recuperação no boot | Várias abas ou janelas |
| Arquivos recentes e reabrir o último | |
| Modo apresentação (esconde a interface) | |
| Bibliotecas `.excalidrawlib` persistidas | |
| Instância única e arquivo via linha de comando | |
| Fontes do Excalidraw embutidas | |

## 3. Arquitetura

### 3.1 Localização

```
Ferramentas/academy-board/
  package.json               name e desktopName: ~/.config/academy-board e WM_CLASS academy-board
  electron.vite.config.ts    main / preload / renderer
  electron-builder.yml       buildResources: resources (build/ é ignorado na raiz)
  vitest.config.ts
  resources/                 ícone (svg fonte + png)
  scripts/copiar-fontes-excalidraw.mjs   postinstall: dist/prod/fonts → public/fonts
  src/
    shared/
      canais-ipc.ts          nomes dos canais
      tipos.ts               contratos entre main, preload e renderer
      csp.ts                 CSP de produção e de desenvolvimento
    main/
      index.ts               instância única, esquema app://, boot
      protocolo.ts           serve out/renderer por app://board com a CSP no cabeçalho
      janela.ts              BrowserWindow, limites, título, confirmarSeSujo
      seguranca.ts           CSP em dev, navegação e permissões
      acoes.ts               novo, abrir, salvar, importar biblioteca (orquestra)
      menu.ts                Arquivo / Exibir, recentes
      armazenamento.ts       electron-store: recentes, última pasta, limites
      recentes.ts            regras da lista de recentes
      arquivos.ts            ler e validar; gravação atômica; argv
      documento-estado.ts    espelho {caminho, sujo}; título
      rascunho.ts            rascunho.json em userData
      biblioteca.ts          biblioteca.excalidrawlib em userData
      ipc.ts                 liga canais às ações
      constantes.ts
    preload/shell.ts         window.api via contextBridge
    renderer/
      index.html
      public/fonts/          gerado, fora do git
      src/
        main.tsx, ativos.ts, App.tsx, estilo.css
        excalidraw/          QuadroExcalidraw.tsx, opcoesUi.ts
        documento/           versaoCena.ts, estadoDocumento.ts, usarDocumento.ts,
                             usarCicloDeDocumento.ts, serializacao.ts
        biblioteca/          usarBibliotecaPersistida.ts
        apresentacao/        usarModoApresentacao.ts
        ipc/api.ts
        componentes/         AvisoErro.tsx, BannerRascunho.tsx
```

### 3.2 Protocolo `app://`

O renderer de produção é servido por `app://board/`, não por `file://`. Página em
`file://` tem origem opaca: o Chromium recusa as fontes locais do Excalidraw como
*cross-origin* e o Excalidraw cai no CDN (`esm.sh`), que a CSP bloqueia. Com um
esquema padrão e seguro, `'self'` volta a valer e as fontes saem de `out/renderer/fonts`.
O Excalidraw ainda declara o CDN como segunda fonte de cada família: o console
mostra essas URLs bloqueadas pela CSP, sem efeito no desenho.

### 3.3 Nomes

Domínio próprio em pt-BR, como o resto do repositório. Símbolos do Excalidraw e
do Electron ficam como estão nos tipos (`elements`, `appState`, `updateScene`).

### 3.4 Onde mora a verdade do documento

- O **renderer** calcula se o documento está sujo: só ele tem os elementos vivos.
  Sujo = hash de `id:version` de todos os elementos (inclusive apagados, como o
  `onChange` entrega) diferente da versão salva. Seleção,
  scroll e zoom mudam o `appState`, não a versão dos elementos: sem falso positivo.
- O **main** mantém um **espelho** `{caminho, sujo}`: o renderer avisa a cada
  transição (sem espera) e reenvia após carregar ou salvar; o main também o zera
  em toda gravação, abertura ou novo. O `close` da janela decide pelo espelho.

## 4. Interações

### 4.1 Menu e atalhos

| Menu | Item | Atalho |
|---|---|---|
| Arquivo | Novo | Ctrl+N |
| | Abrir… | Ctrl+O |
| | Abrir recente ▸ | — |
| | Salvar | Ctrl+S |
| | Salvar como… | Ctrl+Shift+S |
| | Importar biblioteca… | — |
| | Sair | Ctrl+Q |
| Editar | papéis padrão (desfazer, copiar, colar…) | |
| Exibir | Modo apresentação | F5 |
| | Tela cheia | F11 |
| | Ferramentas de desenvolvimento | Ctrl+Shift+I |

Todos são aceleradores do menu, o que também impede o Excalidraw de abrir o seu
próprio salvar/abrir. Acelerador de menu engole a tecla antes de ela chegar ao
canvas: não registrar nele atalho que o Excalidraw precisa ver (Ctrl+Z, Ctrl+A,
letras das ferramentas). Por isso não há menu Editar nem Recarregar (que
descartaria a cena).

### 4.2 Modo apresentação

`zenModeEnabled` do Excalidraw mais uma classe no contêiner que esconde as
barras restantes, inclusive a de ferramentas. O canvas continua editável e as
ferramentas trocam pelo teclado (R, O, A, T, P, E, K para o laser…). A barra de
menu da janela some junto.

### 4.3 Título

`<arquivo> • — Academy Board` com alteração, `<arquivo> — Academy Board` sem,
`Sem título — Academy Board` para documento novo. No OBS, o Window Capture deve
priorizar a **classe da janela** (`academy-board`), porque o título muda.

## 5. Fluxos

**Abrir** (Ctrl+O, recente, argv, segunda instância): `confirmarSeSujo` →
ler e **validar** o arquivo novo (`type === "excalidraw"`) antes de tocar no
atual → `documento:carregado` → renderer faz `restore` + `updateScene` →
main atualiza recentes, última pasta, título e apaga o rascunho.

**Salvar**: o renderer serializa (`serializeAsJSON(…, "local")`) e chama
`arquivo:gravar` (ou `gravar-como` sem caminho). A gravação é atômica
(arquivo temporário + `rename`). Sucesso zera o sujo nos dois lados e apaga o
rascunho.

**Rascunho**: a cada mudança real, com espera de 2 s, `rascunho.json` =
`{caminhoOriginal, conteudoJson, salvoEm}`. No boot, se existe, o renderer
mostra um aviso "Recuperar / Descartar" antes de abrir o último arquivo.
Recuperar mantém o caminho original (Ctrl+S grava no lugar certo) e o documento
sujo. Enquanto o aviso não é respondido, o rascunho fica **pendente** no main:
nenhum rascunho novo é gravado por cima dele, salvar outro documento não o apaga
e fechar, novo, abrir ou segunda instância perguntam "Descartar o rascunho não
recuperado?" antes de seguir.

**Confirmar pendências** (fechar, novo, abrir, segunda instância): com o
documento sujo, diálogo nativo Salvar / Não salvar / Cancelar; depois, com
rascunho pendente, Descartar rascunho / Cancelar. Salvar pede ao renderer que salve
(`documento:salvar-agora` com id de correlação, resposta em até 5 min por causa
do diálogo "salvar como"). Falha ou cancelamento aborta a ação.

**Biblioteca**: `onLibraryChange` persiste `biblioteca.excalidrawlib` em
userData; no boot ela volta por `updateLibrary`. Importar lê um
`.excalidrawlib` e mescla (`merge: true`).

## 6. Segurança

- `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`.
- CSP de produção sem `unsafe-eval`, enviada no cabeçalho do `app://`;
  `style-src 'unsafe-inline'` porque o Excalidraw usa estilo inline. Em dev, a
  CSP vem por `onHeadersReceived` e libera o servidor do Vite.
- Toda janela nova é negada; navegação para fora do app é bloqueada.
- Permissões: só leitura e escrita da área de transferência (colar imagem).

## 7. Testes

| Nível | O quê |
|---|---|
| Unitário (vitest, node) | versão da cena sem falso positivo, reducer do documento, recentes, argv, título, caminho do `app://` sem sair da pasta |
| Unitário com disco | gravação atômica, validação ao abrir, rascunho — em diretório temporário |
| Unitário (jsdom) | ida e volta `serializeAsJSON` → `restore` |
| Interface | validação visual do instrutor: desenho, modo apresentação, OBS, fontes offline |

## 8. Build

```bash
npm install          # também copia as fontes do Excalidraw
npm run dev
npm test
npm run build        # typecheck + electron-vite build
```

## 9. Riscos e decisões em aberto

| Risco | Mitigação |
|---|---|
| Classes internas do Excalidraw usadas no modo apresentação mudam numa atualização | versão fixa; conferir ao atualizar |
| WM_CLASS diferente entre dev e pacote | `desktopName` no package.json vale nos dois; conferir no OBS |
| Carregar texto dispara recálculo de dimensões e marca sujo | `refreshDimensions: false`; conferido abrindo desenho com texto |
| Rascunho único: dois travamentos seguidos com documentos diferentes guardam só o último | aceito |
| Item de biblioteca com imagem precisa de `addFiles` | conferir com biblioteca real |

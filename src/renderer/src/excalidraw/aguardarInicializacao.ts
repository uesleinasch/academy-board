import type { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types'

export type ApiComOnChange = Pick<ExcalidrawImperativeAPI, 'onChange'>

// O Excalidraw expõe a API antes de aplicar o initialData; um updateScene nessa
// janela é sobrescrito pela cena inicial ou herda isLoading=true e trava em "Carregando cena".
export function aguardarInicializacao<Api extends ApiComOnChange>(
  api: Api,
  aoPronto: (api: Api) => void
): void {
  const cancelar = api.onChange((_elementos, appState) => {
    if (appState.isLoading) return
    cancelar()
    aoPronto(api)
  })
}

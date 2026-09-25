import { restore, serializeAsJSON } from '@excalidraw/excalidraw'
import type { AppState, BinaryFiles } from '@excalidraw/excalidraw/types'
import type { ExcalidrawElement } from '@excalidraw/excalidraw/element/types'

export function serializar(
  elementos: readonly ExcalidrawElement[],
  appState: Partial<AppState>,
  arquivos: BinaryFiles
): string {
  return serializeAsJSON(elementos, appState, arquivos, 'local')
}

export function interpretar(conteudoJson: string, appStateAtual: Partial<AppState> | null) {
  return restore(JSON.parse(conteudoJson), appStateAtual, null, {
    refreshDimensions: false,
    repairBindings: true
  })
}

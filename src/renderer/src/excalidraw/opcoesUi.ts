import type { UIOptions } from '@excalidraw/excalidraw/types'

export const OPCOES_UI: Partial<UIOptions> = {
  canvasActions: {
    loadScene: false,
    saveToActiveFile: false,
    export: false,
    saveAsImage: true,
    toggleTheme: true,
    clearCanvas: true,
    changeViewBackgroundColor: true
  }
}

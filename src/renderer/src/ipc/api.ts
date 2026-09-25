import type { ApiBoard } from '../../../preload/shell'

declare global {
  interface Window {
    api: ApiBoard
    EXCALIDRAW_ASSET_PATH?: string | string[]
  }
}

export const api = window.api

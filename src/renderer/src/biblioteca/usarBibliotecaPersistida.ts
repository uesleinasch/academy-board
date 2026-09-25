import { useCallback, useEffect, useMemo } from 'react'
import { MIME_TYPES, serializeLibraryAsJSON } from '@excalidraw/excalidraw'
import type { ExcalidrawImperativeAPI, LibraryItems } from '@excalidraw/excalidraw/types'
import { api } from '../ipc/api'

function comoBlob(conteudoJson: string): Blob {
  return new Blob([conteudoJson], { type: MIME_TYPES.excalidrawlib })
}

export function usarBibliotecaPersistida(excalidraw: ExcalidrawImperativeAPI | null) {
  const hidratar = useCallback(
    (conteudoJson: string) => {
      void excalidraw?.updateLibrary({ libraryItems: comoBlob(conteudoJson), merge: false })
    },
    [excalidraw]
  )

  useEffect(() => {
    if (!excalidraw) return
    return api.aoImportarBiblioteca((conteudoJson) => {
      void excalidraw.updateLibrary({
        libraryItems: comoBlob(conteudoJson),
        merge: true,
        openLibraryMenu: true
      })
    })
  }, [excalidraw])

  const aoMudarBiblioteca = useCallback((itens: LibraryItems) => {
    api.persistirBiblioteca(serializeLibraryAsJSON(itens))
  }, [])

  return useMemo(() => ({ hidratar, aoMudarBiblioteca }), [hidratar, aoMudarBiblioteca])
}

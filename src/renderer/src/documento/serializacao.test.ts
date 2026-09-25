// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'

// O Excalidraw consulta um contexto 2D já no import; o jsdom não tem canvas.
HTMLCanvasElement.prototype.getContext = (() => ({})) as never
const { interpretar, serializar } = await import('./serializacao')

const retangulo = {
  id: 'r1',
  type: 'rectangle',
  x: 10,
  y: 20,
  width: 100,
  height: 50,
  angle: 0,
  strokeColor: '#1e1e1e',
  backgroundColor: 'transparent',
  fillStyle: 'solid',
  strokeWidth: 2,
  strokeStyle: 'solid',
  roughness: 1,
  opacity: 100,
  groupIds: [],
  frameId: null,
  index: 'a0',
  roundness: null,
  seed: 1,
  version: 3,
  versionNonce: 1,
  isDeleted: false,
  boundElements: null,
  updated: 1,
  link: null,
  locked: false
}

describe('serialização', () => {
  it('ida e volta preserva os elementos', () => {
    const json = serializar([retangulo] as never, { viewBackgroundColor: '#ffffff' }, {})
    const dados = JSON.parse(json)
    expect(dados.type).toBe('excalidraw')
    expect(dados.source).toBeDefined()

    const restaurado = interpretar(json, null)
    expect(restaurado.elements).toHaveLength(1)
    expect(restaurado.elements[0]).toMatchObject({ id: 'r1', type: 'rectangle', x: 10, y: 20, width: 100 })
    expect(restaurado.appState.viewBackgroundColor).toBe('#ffffff')
  })

  it('interpretar recusa texto que não é JSON', () => {
    expect(() => interpretar('lixo', null)).toThrow()
  })
})

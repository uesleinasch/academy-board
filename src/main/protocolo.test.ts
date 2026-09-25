import { describe, expect, it, vi } from 'vitest'

vi.mock('electron', () => ({ net: {}, protocol: {} }))
const { caminhoDentroDe } = await import('./protocolo')

describe('caminhoDentroDe', () => {
  const raiz = '/app/out/renderer'

  it('resolve arquivos dentro da pasta do renderer', () => {
    expect(caminhoDentroDe(raiz, '/index.html')).toBe('/app/out/renderer/index.html')
    expect(caminhoDentroDe(raiz, '/fonts/Virgil/Virgil%20Regular.woff2')).toBe(
      '/app/out/renderer/fonts/Virgil/Virgil Regular.woff2'
    )
  })

  it('recusa sair da pasta', () => {
    expect(caminhoDentroDe(raiz, '/../main/index.js')).toBeNull()
    expect(caminhoDentroDe(raiz, '/%2e%2e/%2e%2e/etc/passwd')).toBeNull()
  })
})

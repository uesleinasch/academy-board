import { describe, expect, it } from 'vitest'
import { criarEspelhoDocumento, formatarTitulo } from './documento-estado'

describe('formatarTitulo', () => {
  it('mostra o nome do arquivo e marca alteração', () => {
    expect(formatarTitulo({ caminho: '/aulas/monadas.excalidraw', sujo: false })).toBe(
      'monadas.excalidraw — Academy Board'
    )
    expect(formatarTitulo({ caminho: '/aulas/monadas.excalidraw', sujo: true })).toBe(
      'monadas.excalidraw • — Academy Board'
    )
  })

  it('usa "Sem título" para documento novo', () => {
    expect(formatarTitulo({ caminho: null, sujo: true })).toBe('Sem título • — Academy Board')
  })
})

describe('espelho do documento', () => {
  it('começa limpo e guarda cópia do estado', () => {
    const espelho = criarEspelhoDocumento()
    expect(espelho.atual()).toEqual({ caminho: null, sujo: false })
    const novo = { caminho: '/a', sujo: true }
    espelho.definir(novo)
    novo.sujo = false
    expect(espelho.atual()).toEqual({ caminho: '/a', sujo: true })
  })
})

import { describe, expect, it } from 'vitest'
import { MAX_RECENTES } from './constantes'
import { incluirRecente, removerRecente } from './recentes'

describe('recentes', () => {
  it('põe o arquivo no topo sem duplicar', () => {
    expect(incluirRecente(['/a', '/b', '/c'], '/b')).toEqual(['/b', '/a', '/c'])
  })

  it('limita a lista', () => {
    const cheia = Array.from({ length: MAX_RECENTES }, (_, i) => `/${i}`)
    const lista = incluirRecente(cheia, '/novo')
    expect(lista).toHaveLength(MAX_RECENTES)
    expect(lista[0]).toBe('/novo')
    expect(lista).not.toContain(`/${MAX_RECENTES - 1}`)
  })

  it('remove um arquivo', () => {
    expect(removerRecente(['/a', '/b'], '/a')).toEqual(['/b'])
  })
})

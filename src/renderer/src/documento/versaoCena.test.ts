import { describe, expect, it } from 'vitest'
import { calcularVersao } from './versaoCena'

const cena = [
  { id: 'a', version: 3 },
  { id: 'b', version: 1 }
]

describe('calcularVersao', () => {
  it('é estável para os mesmos elementos', () => {
    expect(calcularVersao(cena)).toBe(calcularVersao(cena.map((e) => ({ ...e }))))
  })

  it('ignora o que não é versão do elemento (seleção, scroll, zoom vivem no appState)', () => {
    const comOutrosCampos = cena.map((e) => ({ ...e, isSelected: true, x: 999 }))
    expect(calcularVersao(comOutrosCampos)).toBe(calcularVersao(cena))
  })

  it('muda quando um elemento muda de versão', () => {
    expect(calcularVersao([{ id: 'a', version: 4 }, cena[1]!])).not.toBe(calcularVersao(cena))
  })

  it('muda quando a ordem dos elementos muda', () => {
    expect(calcularVersao([cena[1]!, cena[0]!])).not.toBe(calcularVersao(cena))
  })

  it('muda quando um elemento entra', () => {
    expect(calcularVersao([...cena, { id: 'c', version: 1 }])).not.toBe(calcularVersao(cena))
  })
})

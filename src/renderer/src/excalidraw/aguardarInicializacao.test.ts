import { describe, expect, it, vi } from 'vitest'
import { aguardarInicializacao, type ApiComOnChange } from './aguardarInicializacao'

type Ouvinte = (elementos: readonly unknown[], appState: { isLoading: boolean }) => void

function apiFalsa() {
  let ouvintes: Ouvinte[] = []
  const api = {
    onChange: (ouvinte: Ouvinte) => {
      ouvintes.push(ouvinte)
      return () => {
        ouvintes = ouvintes.filter((o) => o !== ouvinte)
      }
    }
  }
  const emitir = (isLoading: boolean) => [...ouvintes].forEach((o) => o([], { isLoading }))
  return { api: api as unknown as ApiComOnChange, emitir, inscritos: () => ouvintes.length }
}

describe('aguardarInicializacao', () => {
  it('não entrega a API enquanto o Excalidraw não emitiu a primeira mudança', () => {
    const { api } = apiFalsa()
    const aoPronto = vi.fn()

    aguardarInicializacao(api, aoPronto)

    expect(aoPronto).not.toHaveBeenCalled()
  })

  it('ignora mudança emitida com a cena ainda carregando', () => {
    const { api, emitir } = apiFalsa()
    const aoPronto = vi.fn()

    aguardarInicializacao(api, aoPronto)
    emitir(true)

    expect(aoPronto).not.toHaveBeenCalled()
  })

  it('entrega a API uma única vez quando a cena termina de carregar e se desinscreve', () => {
    const { api, emitir, inscritos } = apiFalsa()
    const aoPronto = vi.fn()

    aguardarInicializacao(api, aoPronto)
    emitir(false)
    emitir(false)

    expect(aoPronto).toHaveBeenCalledTimes(1)
    expect(aoPronto).toHaveBeenCalledWith(api)
    expect(inscritos()).toBe(0)
  })
})

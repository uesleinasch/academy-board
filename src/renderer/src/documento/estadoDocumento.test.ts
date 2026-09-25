import { describe, expect, it } from 'vitest'
import { DOCUMENTO_VAZIO, estaSujo, reduzirDocumento, type EventoDocumento } from './estadoDocumento'

function aplicar(...eventos: EventoDocumento[]) {
  return eventos.reduce(reduzirDocumento, DOCUMENTO_VAZIO)
}

describe('estado do documento', () => {
  it('documento novo começa limpo', () => {
    expect(estaSujo(DOCUMENTO_VAZIO)).toBe(false)
  })

  it('fica sujo só quando a versão muda', () => {
    const carregado = aplicar({ tipo: 'carregado', caminho: '/a', versao: 10 })
    expect(estaSujo(reduzirDocumento(carregado, { tipo: 'alterado', versao: 10 }))).toBe(false)
    expect(estaSujo(reduzirDocumento(carregado, { tipo: 'alterado', versao: 11 }))).toBe(true)
  })

  it('salvar limpa e guarda o caminho escolhido', () => {
    const estado = aplicar(
      { tipo: 'alterado', versao: 5 },
      { tipo: 'salvo', caminho: '/novo.excalidraw', versao: 5 }
    )
    expect(estaSujo(estado)).toBe(false)
    expect(estado.caminho).toBe('/novo.excalidraw')
  })

  it('alteração durante a gravação continua suja', () => {
    const estado = aplicar(
      { tipo: 'alterado', versao: 5 },
      { tipo: 'alterado', versao: 6 },
      { tipo: 'salvo', caminho: '/a', versao: 5 }
    )
    expect(estaSujo(estado)).toBe(true)
  })

  it('rascunho recuperado fica sujo até salvar, mesmo sem mexer', () => {
    const recuperado = aplicar({ tipo: 'recuperado', caminho: '/a', versao: 7 })
    expect(estaSujo(recuperado)).toBe(true)
    expect(recuperado.caminho).toBe('/a')
    expect(estaSujo(reduzirDocumento(recuperado, { tipo: 'salvo', caminho: '/a', versao: 7 }))).toBe(false)
  })

  it('abrir outro arquivo descarta o estado anterior', () => {
    const estado = aplicar(
      { tipo: 'alterado', versao: 5 },
      { tipo: 'carregado', caminho: '/b', versao: 9 }
    )
    expect(estaSujo(estado)).toBe(false)
    expect(estado.caminho).toBe('/b')
  })
})

import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { criarRascunhos } from './rascunho'

const DESENHO = JSON.stringify({ type: 'excalidraw', elements: [] })
const AGORA = new Date('2026-09-25T13:00:00.000Z')

let pasta: string

beforeEach(async () => {
  pasta = await mkdtemp(join(tmpdir(), 'academy-board-'))
})

afterEach(async () => {
  await rm(pasta, { recursive: true, force: true })
})

describe('rascunho', () => {
  it('grava, lê e apaga', async () => {
    const rascunhos = criarRascunhos(pasta, () => AGORA)
    await rascunhos.gravar({ caminhoOriginal: '/a.excalidraw', conteudoJson: DESENHO })
    expect(await rascunhos.lerParaRecuperar()).toEqual({
      caminhoOriginal: '/a.excalidraw',
      conteudoJson: DESENHO,
      salvoEm: AGORA.toISOString()
    })
    await rascunhos.apagar()
    expect(await rascunhos.lerParaRecuperar()).toBeNull()
  })

  it('não existe rascunho numa pasta nova', async () => {
    expect(await criarRascunhos(pasta).lerParaRecuperar()).toBeNull()
  })

  it('ignora rascunho corrompido', async () => {
    await writeFile(join(pasta, 'rascunho.json'), '{"conteudoJson":"lixo"}')
    expect(await criarRascunhos(pasta).lerParaRecuperar()).toBeNull()
  })

  it('rascunho lido fica pendente até ser assumido, regravado ou apagado', async () => {
    const rascunhos = criarRascunhos(pasta)
    await rascunhos.gravar({ caminhoOriginal: null, conteudoJson: DESENHO })
    expect(rascunhos.pendente()).toBe(false)

    await rascunhos.lerParaRecuperar()
    expect(rascunhos.pendente()).toBe(true)
    rascunhos.assumir()
    expect(rascunhos.pendente()).toBe(false)

    await rascunhos.lerParaRecuperar()
    await rascunhos.apagar()
    expect(rascunhos.pendente()).toBe(false)
  })

  it('sem rascunho no disco nada fica pendente', async () => {
    const rascunhos = criarRascunhos(pasta)
    await rascunhos.lerParaRecuperar()
    expect(rascunhos.pendente()).toBe(false)
  })

  it('apagar sem rascunho não falha', async () => {
    await expect(criarRascunhos(pasta).apagar()).resolves.toBeUndefined()
  })
})

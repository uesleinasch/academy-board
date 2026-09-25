import { mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { caminhoDeArgv, comExtensao, gravarAtomico, lerDocumento, validarConteudo } from './arquivos'

const DESENHO = JSON.stringify({ type: 'excalidraw', version: 2, elements: [], appState: {} })

let pasta: string

beforeEach(async () => {
  pasta = await mkdtemp(join(tmpdir(), 'academy-board-'))
})

afterEach(async () => {
  await rm(pasta, { recursive: true, force: true })
})

describe('validarConteudo', () => {
  it('aceita um desenho do Excalidraw', () => {
    expect(validarConteudo(DESENHO)).toBeNull()
  })

  it('recusa JSON inválido', () => {
    expect(validarConteudo('{')).toMatch(/JSON/)
  })

  it('recusa JSON que não é desenho', () => {
    expect(validarConteudo(JSON.stringify({ type: 'excalidrawlib', libraryItems: [] }))).not.toBeNull()
    expect(validarConteudo(JSON.stringify({ type: 'excalidraw' }))).not.toBeNull()
    expect(validarConteudo('null')).not.toBeNull()
  })
})

describe('lerDocumento', () => {
  it('lê um desenho válido', async () => {
    const caminho = join(pasta, 'a.excalidraw')
    await writeFile(caminho, DESENHO)
    expect(await lerDocumento(caminho)).toEqual({ ok: true, conteudoJson: DESENHO })
  })

  it('informa arquivo corrompido com o nome dele', async () => {
    const caminho = join(pasta, 'quebrado.excalidraw')
    await writeFile(caminho, 'lixo')
    const leitura = await lerDocumento(caminho)
    expect(leitura.ok).toBe(false)
    if (!leitura.ok) expect(leitura.erro).toContain('quebrado.excalidraw')
  })

  it('informa arquivo inexistente', async () => {
    const leitura = await lerDocumento(join(pasta, 'sumiu.excalidraw'))
    expect(leitura.ok).toBe(false)
  })
})

describe('gravarAtomico', () => {
  it('substitui o conteúdo sem deixar temporário', async () => {
    const caminho = join(pasta, 'a.excalidraw')
    await writeFile(caminho, 'antigo')
    await gravarAtomico(caminho, DESENHO)
    expect(await readFile(caminho, 'utf-8')).toBe(DESENHO)
    expect(await readdir(pasta)).toEqual(['a.excalidraw'])
  })

  it('falha sem apagar o original quando a pasta não existe', async () => {
    await expect(gravarAtomico(join(pasta, 'nao-existe', 'a.excalidraw'), DESENHO)).rejects.toThrow()
  })
})

describe('comExtensao', () => {
  it('acrescenta a extensão só quando falta', () => {
    expect(comExtensao('/x/aula')).toBe('/x/aula.excalidraw')
    expect(comExtensao('/x/aula.excalidraw')).toBe('/x/aula.excalidraw')
    expect(comExtensao('/x/aula.EXCALIDRAW')).toBe('/x/aula.EXCALIDRAW')
  })
})

describe('caminhoDeArgv', () => {
  it('acha o .excalidraw ignorando o executável e as flags', () => {
    expect(caminhoDeArgv(['/bin/academy-board', '--no-sandbox', 'aula.excalidraw'], '/home/u'))
      .toBe('/home/u/aula.excalidraw')
  })

  it('mantém caminho absoluto', () => {
    expect(caminhoDeArgv(['electron', '.', '/tmp/a.excalidraw'])).toBe('/tmp/a.excalidraw')
  })

  it('devolve null sem desenho', () => {
    expect(caminhoDeArgv(['electron', '.'])).toBeNull()
  })
})

import { randomBytes } from 'node:crypto'
import { readFile, rename, rm, writeFile } from 'node:fs/promises'
import { basename, dirname, extname, join, resolve } from 'node:path'
import { EXTENSAO_DOCUMENTO } from './constantes'

export type Leitura = { ok: true; conteudoJson: string } | { ok: false; erro: string }

export function validarConteudo(texto: string): string | null {
  let dados: unknown
  try {
    dados = JSON.parse(texto)
  } catch {
    return 'o arquivo não é um JSON válido'
  }
  if (typeof dados !== 'object' || dados === null) return 'o arquivo não é um desenho do Excalidraw'
  const { type, elements } = dados as { type?: unknown; elements?: unknown }
  if (type !== 'excalidraw' || !Array.isArray(elements)) {
    return 'o arquivo não é um desenho do Excalidraw'
  }
  return null
}

export async function lerDocumento(caminho: string): Promise<Leitura> {
  let texto: string
  try {
    texto = await readFile(caminho, 'utf-8')
  } catch (erro) {
    return { ok: false, erro: `não foi possível ler ${basename(caminho)}: ${mensagem(erro)}` }
  }
  const invalido = validarConteudo(texto)
  if (invalido) return { ok: false, erro: `${basename(caminho)}: ${invalido}` }
  return { ok: true, conteudoJson: texto }
}

export async function gravarAtomico(caminho: string, conteudo: string): Promise<void> {
  const temporario = join(dirname(caminho), `.${basename(caminho)}.${randomBytes(4).toString('hex')}.tmp`)
  try {
    await writeFile(temporario, conteudo, 'utf-8')
    await rename(temporario, caminho)
  } catch (erro) {
    await rm(temporario, { force: true })
    throw erro
  }
}

export function comExtensao(caminho: string, extensao = EXTENSAO_DOCUMENTO): string {
  return extname(caminho).toLowerCase() === `.${extensao}` ? caminho : `${caminho}.${extensao}`
}

export function caminhoDeArgv(argv: readonly string[], cwd = process.cwd()): string | null {
  const alvo = argv
    .slice(1)
    .find((arg) => !arg.startsWith('-') && extname(arg).toLowerCase() === `.${EXTENSAO_DOCUMENTO}`)
  return alvo ? resolve(cwd, alvo) : null
}

export function mensagem(erro: unknown): string {
  return erro instanceof Error ? erro.message : String(erro)
}

import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { gravarAtomico } from './arquivos'

const NOME_ARQUIVO = 'biblioteca.excalidrawlib'

export function criarBiblioteca(pasta: string) {
  const caminho = join(pasta, NOME_ARQUIVO)

  return {
    async ler(): Promise<string | null> {
      try {
        return await readFile(caminho, 'utf-8')
      } catch {
        return null
      }
    },

    async gravar(conteudoJson: string): Promise<void> {
      await gravarAtomico(caminho, conteudoJson)
    }
  }
}

export async function lerBibliotecaImportada(caminho: string): Promise<string> {
  const texto = await readFile(caminho, 'utf-8')
  const dados = JSON.parse(texto) as { type?: unknown }
  if (dados.type !== 'excalidrawlib') throw new Error('o arquivo não é uma biblioteca do Excalidraw')
  return texto
}

export type Biblioteca = ReturnType<typeof criarBiblioteca>

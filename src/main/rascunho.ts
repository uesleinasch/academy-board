import { readFile, rm } from 'node:fs/promises'
import { join } from 'node:path'
import type { PedidoRascunho, Rascunho } from '@shared/tipos'
import { gravarAtomico, validarConteudo } from './arquivos'

const NOME_ARQUIVO = 'rascunho.json'

export function criarRascunhos(pasta: string, agora: () => Date = () => new Date()) {
  const caminho = join(pasta, NOME_ARQUIVO)
  let pendente = false

  async function ler(): Promise<Rascunho | null> {
    try {
      const rascunho = JSON.parse(await readFile(caminho, 'utf-8')) as Rascunho
      return validarConteudo(rascunho.conteudoJson) ? null : rascunho
    } catch {
      return null
    }
  }

  return {
    async gravar(pedido: PedidoRascunho): Promise<void> {
      pendente = false
      const rascunho: Rascunho = { ...pedido, salvoEm: agora().toISOString() }
      await gravarAtomico(caminho, JSON.stringify(rascunho))
    },

    async lerParaRecuperar(): Promise<Rascunho | null> {
      const rascunho = await ler()
      pendente = rascunho !== null
      return rascunho
    },

    assumir(): void {
      pendente = false
    },

    pendente: (): boolean => pendente,

    async apagar(): Promise<void> {
      pendente = false
      await rm(caminho, { force: true })
    }
  }
}

export type Rascunhos = ReturnType<typeof criarRascunhos>

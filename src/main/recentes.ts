import { MAX_RECENTES } from './constantes'

export function incluirRecente(recentes: readonly string[], caminho: string): string[] {
  return [caminho, ...recentes.filter((p) => p !== caminho)].slice(0, MAX_RECENTES)
}

export function removerRecente(recentes: readonly string[], caminho: string): string[] {
  return recentes.filter((p) => p !== caminho)
}

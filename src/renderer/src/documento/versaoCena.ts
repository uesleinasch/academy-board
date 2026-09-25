export interface ElementoVersionado {
  readonly id: string
  readonly version: number
}

export function calcularVersao(elementos: readonly ElementoVersionado[]): number {
  let hash = 0x811c9dc5
  for (const { id, version } of elementos) {
    const chave = `${id}:${version};`
    for (let i = 0; i < chave.length; i++) {
      hash ^= chave.charCodeAt(i)
      hash = Math.imul(hash, 0x01000193)
    }
  }
  return hash >>> 0
}

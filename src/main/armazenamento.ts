import Store from 'electron-store'

export interface LimitesJanela {
  x: number
  y: number
  width: number
  height: number
  maximizada: boolean
}

export interface EsquemaPersistido {
  ultimoArquivo: string | null
  recentes: string[]
  ultimaPasta: string | null
  limitesJanela: LimitesJanela | null
}

export function criarArmazenamento(cwd?: string): Store<EsquemaPersistido> {
  return new Store<EsquemaPersistido>({
    name: 'academy-board',
    cwd,
    defaults: {
      ultimoArquivo: null,
      recentes: [],
      ultimaPasta: null,
      limitesJanela: null
    }
  })
}

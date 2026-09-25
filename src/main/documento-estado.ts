import { basename } from 'node:path'
import { TITULO_APP } from './constantes'

export interface EstadoDocumento {
  caminho: string | null
  sujo: boolean
}

export function criarEspelhoDocumento() {
  let estado: EstadoDocumento = { caminho: null, sujo: false }

  return {
    atual: (): EstadoDocumento => estado,
    definir(novo: EstadoDocumento): void {
      estado = { ...novo }
    }
  }
}

export function formatarTitulo({ caminho, sujo }: EstadoDocumento): string {
  const nome = caminho ? basename(caminho) : 'Sem título'
  return `${nome}${sujo ? ' •' : ''} — ${TITULO_APP}`
}

export type EspelhoDocumento = ReturnType<typeof criarEspelhoDocumento>

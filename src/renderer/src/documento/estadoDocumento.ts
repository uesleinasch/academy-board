import { calcularVersao } from './versaoCena'

export interface EstadoDocumento {
  caminho: string | null
  versaoSalva: number | null
  versaoAtual: number
}

export type EventoDocumento =
  | { tipo: 'carregado'; caminho: string | null; versao: number }
  | { tipo: 'recuperado'; caminho: string | null; versao: number }
  | { tipo: 'alterado'; versao: number }
  | { tipo: 'salvo'; caminho: string; versao: number }

const VERSAO_VAZIA = calcularVersao([])

export const DOCUMENTO_VAZIO: EstadoDocumento = {
  caminho: null,
  versaoSalva: VERSAO_VAZIA,
  versaoAtual: VERSAO_VAZIA
}

export function reduzirDocumento(estado: EstadoDocumento, evento: EventoDocumento): EstadoDocumento {
  switch (evento.tipo) {
    case 'carregado':
      return { caminho: evento.caminho, versaoSalva: evento.versao, versaoAtual: evento.versao }
    case 'recuperado':
      return { caminho: evento.caminho, versaoSalva: null, versaoAtual: evento.versao }
    case 'alterado':
      return { ...estado, versaoAtual: evento.versao }
    case 'salvo':
      return { ...estado, caminho: evento.caminho, versaoSalva: evento.versao }
  }
}

export function estaSujo({ versaoSalva, versaoAtual }: EstadoDocumento): boolean {
  return versaoSalva !== versaoAtual
}

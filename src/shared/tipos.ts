export interface DocumentoCarregado {
  caminho: string | null
  conteudoJson: string
}

export interface Rascunho {
  caminhoOriginal: string | null
  conteudoJson: string
  salvoEm: string
}

export interface EstadoInicial {
  documento: DocumentoCarregado | null
  rascunho: Rascunho | null
  bibliotecaJson: string | null
}

export type ResultadoGravacao = { ok: true; caminho: string } | { ok: false; erro: string | null }

export interface PedidoGravacao {
  caminho: string
  conteudoJson: string
}

export interface PedidoGravacaoComo {
  conteudoJson: string
}

export interface MudancaSujo {
  caminho: string | null
  sujo: boolean
}

export interface RespostaSalvarAgora {
  id: string
  ok: boolean
}

export interface PedidoRascunho {
  caminhoOriginal: string | null
  conteudoJson: string
}

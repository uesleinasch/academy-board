import type { Rascunho } from '@shared/tipos'

interface Props {
  rascunho: Rascunho
  aoRecuperar: () => void
  aoDescartar: () => void
}

function descrever({ caminhoOriginal, salvoEm }: Rascunho): string {
  const nome = caminhoOriginal?.split('/').pop() ?? 'desenho sem título'
  const hora = new Date(salvoEm).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
  return `Há alterações não salvas de ${nome} (${hora}).`
}

export function BannerRascunho({ rascunho, aoRecuperar, aoDescartar }: Props) {
  return (
    <div className="aviso" role="status">
      <span>{descrever(rascunho)}</span>
      <button type="button" className="aviso__principal" onClick={aoRecuperar}>
        Recuperar
      </button>
      <button type="button" onClick={aoDescartar}>
        Descartar
      </button>
    </div>
  )
}

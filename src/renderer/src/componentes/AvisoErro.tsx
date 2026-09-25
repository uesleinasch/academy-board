interface Props {
  mensagem: string
  aoFechar: () => void
}

export function AvisoErro({ mensagem, aoFechar }: Props) {
  return (
    <div className="aviso aviso--erro" role="alert">
      <span>{mensagem}</span>
      <button type="button" onClick={aoFechar}>
        Fechar
      </button>
    </div>
  )
}

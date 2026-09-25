import { useCallback, useMemo, useRef } from 'react'
import type { MudancaSujo } from '@shared/tipos'
import { api } from '../ipc/api'
import {
  DOCUMENTO_VAZIO,
  estaSujo,
  reduzirDocumento,
  type EstadoDocumento,
  type EventoDocumento
} from './estadoDocumento'

export function usarDocumento() {
  const estado = useRef<EstadoDocumento>(DOCUMENTO_VAZIO)
  const informado = useRef<MudancaSujo>({ caminho: null, sujo: false })

  const aplicar = useCallback((evento: EventoDocumento) => {
    estado.current = reduzirDocumento(estado.current, evento)
    const atual: MudancaSujo = { caminho: estado.current.caminho, sujo: estaSujo(estado.current) }
    const mudou =
      atual.sujo !== informado.current.sujo || atual.caminho !== informado.current.caminho
    // Fora de 'alterado' o main acabou de redefinir o próprio espelho: reenviar sempre.
    if (mudou || evento.tipo !== 'alterado') {
      informado.current = atual
      api.informarSujo(atual)
    }
  }, [])

  const sujo = useCallback(() => estaSujo(estado.current), [])
  const caminho = useCallback(() => estado.current.caminho, [])

  return useMemo(() => ({ aplicar, sujo, caminho }), [aplicar, sujo, caminho])
}

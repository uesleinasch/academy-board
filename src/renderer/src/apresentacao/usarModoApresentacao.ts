import { useEffect, useState } from 'react'
import { api } from '../ipc/api'

export function usarModoApresentacao(): boolean {
  const [apresentando, setApresentando] = useState(false)

  useEffect(() => api.aoAlternarApresentacao(() => setApresentando((atual) => !atual)), [])
  useEffect(() => api.informarApresentacao(apresentando), [apresentando])

  return apresentando
}

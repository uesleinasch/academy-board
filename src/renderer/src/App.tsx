import { useState } from 'react'
import type { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types'
import { usarModoApresentacao } from './apresentacao/usarModoApresentacao'
import { usarBibliotecaPersistida } from './biblioteca/usarBibliotecaPersistida'
import { AvisoErro } from './componentes/AvisoErro'
import { BannerRascunho } from './componentes/BannerRascunho'
import { usarCicloDeDocumento } from './documento/usarCicloDeDocumento'
import { QuadroExcalidraw } from './excalidraw/QuadroExcalidraw'

export function App() {
  const [excalidraw, setExcalidraw] = useState<ExcalidrawImperativeAPI | null>(null)
  const biblioteca = usarBibliotecaPersistida(excalidraw)
  const ciclo = usarCicloDeDocumento(excalidraw, biblioteca.hidratar)
  const apresentando = usarModoApresentacao()

  return (
    <>
      <QuadroExcalidraw
        apresentando={apresentando}
        aoPronto={setExcalidraw}
        aoMudar={ciclo.aoMudar}
        aoMudarBiblioteca={biblioteca.aoMudarBiblioteca}
      />
      <div className="avisos">
        {ciclo.rascunho && (
          <BannerRascunho
            rascunho={ciclo.rascunho}
            aoRecuperar={ciclo.recuperarRascunho}
            aoDescartar={ciclo.descartarRascunho}
          />
        )}
        {ciclo.erro && <AvisoErro mensagem={ciclo.erro} aoFechar={ciclo.limparErro} />}
      </div>
    </>
  )
}

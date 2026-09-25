import { session, type WebContents } from 'electron'
import { CSP_DESENVOLVIMENTO } from '@shared/csp'
import { ESQUEMA } from './protocolo'

export function aplicarSeguranca(conteudo: WebContents, urlDesenvolvimento: string | undefined): void {
  if (urlDesenvolvimento) {
    session.defaultSession.webRequest.onHeadersReceived((detalhes, responder) => {
      responder({
        responseHeaders: {
          ...detalhes.responseHeaders,
          'Content-Security-Policy': [CSP_DESENVOLVIMENTO]
        }
      })
    })
  }

  session.defaultSession.setPermissionRequestHandler((_conteudo, permissao, responder) => {
    responder(permissao === 'clipboard-read' || permissao === 'clipboard-sanitized-write')
  })

  conteudo.setWindowOpenHandler(() => ({ action: 'deny' }))
  conteudo.on('will-navigate', (evento, url) => {
    const permitido = url.startsWith(urlDesenvolvimento ?? `${ESQUEMA}://`)
    if (!permitido) evento.preventDefault()
  })
}

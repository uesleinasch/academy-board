import { join, normalize, relative, isAbsolute } from 'node:path'
import { pathToFileURL } from 'node:url'
import { net, protocol } from 'electron'
import { CSP_PRODUCAO } from '@shared/csp'

export const ESQUEMA = 'app'
export const URL_APP = `${ESQUEMA}://board/index.html`

export function registrarEsquema(): void {
  protocol.registerSchemesAsPrivileged([
    { scheme: ESQUEMA, privileges: { standard: true, secure: true, supportFetchAPI: true } }
  ])
}

export function caminhoDentroDe(raiz: string, pathname: string): string | null {
  const alvo = normalize(join(raiz, decodeURIComponent(pathname)))
  const relativo = relative(raiz, alvo)
  return relativo.startsWith('..') || isAbsolute(relativo) ? null : alvo
}

export function servirRenderer(raiz: string): void {
  protocol.handle(ESQUEMA, async (pedido) => {
    const arquivo = caminhoDentroDe(raiz, new URL(pedido.url).pathname)
    if (!arquivo) return new Response(null, { status: 404 })
    const resposta = await net.fetch(pathToFileURL(arquivo).toString())
    if (!arquivo.endsWith('.html')) return resposta
    const cabecalhos = new Headers(resposta.headers)
    cabecalhos.set('Content-Security-Policy', CSP_PRODUCAO)
    return new Response(resposta.body, { status: resposta.status, headers: cabecalhos })
  })
}

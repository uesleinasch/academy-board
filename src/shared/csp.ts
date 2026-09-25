const DIRETIVAS = {
  'default-src': "'self'",
  'script-src': "'self'",
  'style-src': "'self' 'unsafe-inline'",
  'img-src': "'self' data: blob:",
  'font-src': "'self' data:",
  'connect-src': "'self' data: blob:",
  'worker-src': "'self' blob:",
  'object-src': "'none'",
  'base-uri': "'none'",
  'form-action': "'none'"
}

function montar(diretivas: Record<string, string>): string {
  return Object.entries(diretivas)
    .map(([nome, valor]) => `${nome} ${valor}`)
    .join('; ')
}

export const CSP_PRODUCAO = montar(DIRETIVAS)

export const CSP_DESENVOLVIMENTO = montar({
  ...DIRETIVAS,
  'script-src': "'self' 'unsafe-inline' 'unsafe-eval'",
  'connect-src': "'self' data: blob: ws: http://localhost:*"
})

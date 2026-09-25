import { cpSync, existsSync, rmSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..')
const origem = join(raiz, 'node_modules/@excalidraw/excalidraw/dist/prod/fonts')
const destino = join(raiz, 'src/renderer/public/fonts')

if (!existsSync(origem)) {
  console.warn(`[academy-board] fontes do Excalidraw não encontradas em ${origem}`)
  process.exit(0)
}

rmSync(destino, { recursive: true, force: true })
cpSync(origem, destino, { recursive: true })
console.log(`[academy-board] fontes do Excalidraw copiadas para ${destino}`)

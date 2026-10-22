// Rebuilds the PNG icons (favicon, apple touch, PWA) from public/logo.svg:  node scripts/make-icons.mjs
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'public')
const svg = await readFile(path.join(root, 'logo.svg'))

const plain = [
  ['favicon-32.png', 32],
  ['apple-touch-icon.png', 180],
  ['icon-192.png', 192],
  ['icon-512.png', 512],
]
for (const [name, size] of plain)
  await sharp(svg, { density: 384 }).resize(size, size).png().toFile(path.join(root, 'icons', name))

// Maskable: full-bleed background, the mark kept inside the 80 % safe zone.
const size = 512
const inner = Math.round(size * 0.62)
const mark = await sharp(svg, { density: 384 }).resize(inner, inner).png().toBuffer()
await sharp({ create: { width: size, height: size, channels: 4, background: '#1c2465' } })
  .composite([{ input: mark, gravity: 'centre' }])
  .png()
  .toFile(path.join(root, 'icons', 'maskable-512.png'))
console.log('icons rebuilt')

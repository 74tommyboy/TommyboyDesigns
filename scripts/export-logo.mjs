import sharp from 'sharp'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const svgPath = join(__dirname, '../public/logo-export.svg')
const outPath = join(__dirname, '../public/tbd-logo.png')

const svg = readFileSync(svgPath)

await sharp(svg)
  .resize(880, 320)
  .png()
  .toFile(outPath)

console.log('Logo exported to public/tbd-logo.png')

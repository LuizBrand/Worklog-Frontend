/**
 * Gera os favicons a partir do mesmo símbolo usado por
 * src/components/worklog/logo.tsx, renderizando no Chromium — o mesmo
 * motor que desenha a logo no app, então o ícone sai idêntico.
 *
 *   pnpm exec node scripts/generate-icons.mjs
 *
 * Saída: src/app/icon.png e src/app/apple-icon.png
 */
import { chromium } from 'playwright'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const INDIGO = '#6366f1'
const STROKE = '#ffffff'
const PATH = 'M22 33 L34.5 67 L50.4 40 L58.4 57.5 L66 33'

/** rounded=false para o apple-icon: o iOS aplica a própria máscara. */
const svg = (rounded) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 88 88" width="88" height="88">
  <rect width="88" height="88" rx="${rounded ? 22 : 0}" fill="${INDIGO}"/>
  <path d="${PATH}" fill="none" stroke="${STROKE}" stroke-width="7"
        stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="72" cy="27" r="2" fill="${STROKE}"/>
</svg>`

const TARGETS = [
  { out: 'src/app/icon.png', size: 192, rounded: true },
  { out: 'src/app/apple-icon.png', size: 180, rounded: false },
]

const browser = await chromium.launch()
try {
  for (const { out, size, rounded } of TARGETS) {
    const page = await browser.newPage({
      viewport: { width: size, height: size },
      deviceScaleFactor: 1,
    })
    await page.setContent(
      `<style>html,body{margin:0;padding:0;background:transparent}
       svg{display:block;width:${size}px;height:${size}px}</style>${svg(rounded)}`,
    )
    const file = path.join(ROOT, out)
    await page.screenshot({ path: file, omitBackground: true })
    await page.close()
    console.log(`${out}  ${size}x${size}  rounded=${rounded}`)
  }
} finally {
  await browser.close()
}

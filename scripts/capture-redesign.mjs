import { chromium } from 'playwright'

const EMAIL = process.env.WL_LOGIN_EMAIL || 'luiz.brand@exemplo.com'
const PASSWORD = process.env.WL_LOGIN_PASSWORD || 'Senha@123'
const BASE = process.env.WL_BASE_URL || 'http://localhost:3000'
const OUT_DIR = process.env.WL_OUT_DIR || '.agent/visual'

const SHOTS = [
  { name: 'r1-clientes-desktop', url: '/clientes', viewport: { width: 1440, height: 900 } },
  { name: 'r1-clientes-mobile',  url: '/clientes', viewport: { width: 390,  height: 844 } },
  { name: 'r2-sistemas-desktop', url: '/sistemas', viewport: { width: 1440, height: 900 } },
  { name: 'r2-sistemas-mobile',  url: '/sistemas', viewport: { width: 390,  height: 844 } },
  { name: 'r3-usuarios-desktop', url: '/usuarios', viewport: { width: 1440, height: 900 } },
  { name: 'r3-usuarios-mobile',  url: '/usuarios', viewport: { width: 390,  height: 844 } },
]

const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await ctx.newPage()

await page.goto(`${BASE}/login`, { waitUntil: 'networkidle', timeout: 30000 })
await page.locator('input[type="email"], input[name="email"]').first().fill(EMAIL)
await page.locator('input[type="password"]').first().fill(PASSWORD)
await Promise.all([
  page.waitForURL(/\/(dashboard|clientes|sistemas|usuarios)/, { timeout: 15000 }),
  page.locator('button[type="submit"]').first().click(),
])

for (const shot of SHOTS) {
  await page.setViewportSize(shot.viewport)
  await page.goto(`${BASE}${shot.url}`, { waitUntil: 'networkidle', timeout: 30000 })
  await page.waitForTimeout(800)
  const out = `${OUT_DIR}/${shot.name}.png`
  await page.screenshot({ path: out, fullPage: false })
  console.log('Captured:', out)
}

await browser.close()

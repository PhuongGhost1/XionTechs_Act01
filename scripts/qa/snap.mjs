// usage: node snap.mjs <w> <h> <tag> <y,y,...> [reduced]   (y may be "#id" to scroll to a section top)
import puppeteer from 'puppeteer-core'
import { mkdirSync } from 'node:fs'
const [w, h, tag, ys, mode = ''] = process.argv.slice(2)
const width = Number(w)
const out = new URL('./out/', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')
mkdirSync(out, { recursive: true })
const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  headless: 'shell',
  userDataDir: new URL('./profile-' + tag + '/', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'),
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'],
  defaultViewport: { width, height: Number(h), deviceScaleFactor: 1, isMobile: width < 700, hasTouch: width < 700 },
})
const page = await browser.newPage()
if (mode.includes('reduced')) await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])
const logs = []
page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) logs.push(m.text().slice(0, 200)) })
page.on('pageerror', (e) => logs.push('pageerror ' + String(e).slice(0, 200)))
await page.goto('http://localhost:5173/concepts/command/', { waitUntil: 'networkidle2', timeout: 60000 })
await new Promise((r) => setTimeout(r, 4000))
let i = 0
for (const y of ys.split(',')) {
  await page.evaluate((v) => {
    const top = v.startsWith('#') ? document.querySelector(v).getBoundingClientRect().top + scrollY - 56 : Number(v)
    window.scrollTo({ top, behavior: 'instant' })
  }, y)
  await new Promise((r) => setTimeout(r, 2500))
  await page.screenshot({ path: `${out}${tag}-${String(i++).padStart(2, '0')}.png` })
}
console.log(JSON.stringify({ logs: [...new Set(logs)], n: i }))
await browser.close()

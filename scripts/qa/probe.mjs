// Probe: evaluate a snippet in the page after load. usage: node probe.mjs <width> <height> <scrollSelector|0> "<js>"
import puppeteer from 'puppeteer-core'
const [w = '1280', h = '800', sel = '0', js = 'document.title', tag = 'p'] = process.argv.slice(2)
const width = Number(w)
const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  headless: 'shell',
  userDataDir: new URL('./profile-' + tag + '/', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'),
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'],
  defaultViewport: { width, height: Number(h), deviceScaleFactor: 1, isMobile: width < 700, hasTouch: width < 700 },
})
const page = await browser.newPage()
if (process.env.REDUCED) await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])
const logs = []
page.on('console', (m) => logs.push(`[${m.type()}] ${m.text().slice(0, 200)}`))
page.on('pageerror', (e) => logs.push(`[pageerror] ${String(e).slice(0, 300)}`))
await page.goto('http://localhost:5173/concepts/command/', { waitUntil: 'networkidle2', timeout: 60000 })
await new Promise((r) => setTimeout(r, 3000))
if (sel !== '0') {
  await page.evaluate((s) => document.querySelector(s)?.scrollIntoView({ block: 'start', behavior: 'instant' }), sel)
  await new Promise((r) => setTimeout(r, 3000))
}
const res = await page.evaluate(js)
console.log(JSON.stringify(res, null, 1))
console.log(logs.filter((l) => !l.includes('vite') && !l.includes('DevTools')).slice(0, 8).join('\n'))
await browser.close()

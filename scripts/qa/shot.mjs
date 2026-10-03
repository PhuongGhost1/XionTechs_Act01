// QA harness: loads the Command concept in headless Edge and captures each section.
// usage: node shot.mjs <width> <height> <tag> [url] [extra: reduced|slow]
import puppeteer from 'puppeteer-core'
import { mkdirSync, writeFileSync } from 'node:fs'

const [w = '1280', h = '800', tag = 'd', url = (process.env.QA_ORIGIN || 'http://localhost:5173') + '/concepts/command/', mode = ''] = process.argv.slice(2)
const width = Number(w)
const height = Number(h)
const out = new URL('./out/', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')
mkdirSync(out, { recursive: true })

const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  headless: 'shell',
  userDataDir: new URL('./profile-' + tag + '/', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'),
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl', '--no-sandbox'],
  defaultViewport: { width, height, deviceScaleFactor: 1, isMobile: width < 700, hasTouch: width < 700 },
})
const page = await browser.newPage()
if (mode.includes('reduced')) await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])
const logs = []
page.on('console', (m) => {
  const t = m.type()
  if (t === 'error' || t === 'warning') logs.push(`[${t}] ${m.text().slice(0, 300)}`)
})
page.on('pageerror', (e) => logs.push(`[pageerror] ${String(e).slice(0, 400)}`))
page.on('requestfailed', (r) => logs.push(`[requestfailed] ${r.url()}`))

await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 })
await new Promise((r) => setTimeout(r, 4500))

const info = await page.evaluate(() => {
  const de = document.documentElement
  const secs = [...document.querySelectorAll('main > section[id]')].map((s) => ({ id: s.id, top: Math.round(s.getBoundingClientRect().top + scrollY), h: Math.round(s.getBoundingClientRect().height) }))
  return { scrollW: de.scrollWidth, clientW: de.clientWidth, docH: de.scrollHeight, xcore: de.dataset.xcore, xcoreLogo: de.dataset.xcoreLogo, canvas: !!document.querySelector('canvas'), secs }
})

const shots = []
const shoot = async (name, y) => {
  await page.evaluate((yy) => window.scrollTo({ top: yy, behavior: 'instant' }), y)
  await new Promise((r) => setTimeout(r, 2200))
  const file = `${out}${tag}-${name}.png`
  await page.screenshot({ path: file })
  shots.push(file)
}

await shoot('00-top', 0)
for (const s of info.secs.slice(1)) {
  await shoot(`${s.id}-a`, Math.max(0, s.top - 56))
  if (s.h > height * 0.9 && s.h <= height * 1.5) await shoot(s.id + '-end', Math.max(0, s.top + s.h - height + 56))
  if (s.h > height * 1.5) {
    for (let k = 1; k * (height - 120) < s.h - height * 0.4; k++) await shoot(`${s.id}-${String.fromCharCode(97 + k)}`, Math.max(0, s.top - 56 + k * (height - 120)))
  }
}
await shoot('zz-bottom', info.docH)

// elements that stick out past the viewport (overflow culprits)
const wide = await page.evaluate((vw) => {
  const bad = []
  for (const el of document.querySelectorAll('body *')) {
    const r = el.getBoundingClientRect()
    if (r.width > 0 && r.right > vw + 1 && getComputedStyle(el).position !== 'fixed') {
      const cls = (el.className && el.className.baseVal === undefined ? String(el.className) : '').slice(0, 60)
      bad.push(`${el.tagName.toLowerCase()}.${cls} right=${Math.round(r.right)}`)
    }
  }
  return bad.slice(0, 12)
}, width)

writeFileSync(`${out}${tag}-summary.json`, JSON.stringify({ width, height, info, wide, logs: [...new Set(logs)], shots }, null, 2))
console.log(JSON.stringify({ width, height, scrollW: info.scrollW, clientW: info.clientW, docH: info.docH, xcore: info.xcore, xcoreLogo: info.xcoreLogo, secs: info.secs, wide, logs: [...new Set(logs)].slice(0, 12), shots: shots.map((s) => s.split('/').pop()) }, null, 1))
await browser.close()

// Interaction QA: tabs, mobile menu, pause, hover, keyboard. usage: node interact.mjs <w> <h> <tag>
import puppeteer from 'puppeteer-core'
import { mkdirSync } from 'node:fs'
const [w = '1280', h = '800', tag = 'i'] = process.argv.slice(2)
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
const logs = []
page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) logs.push(m.text().slice(0, 220)) })
page.on('pageerror', (e) => logs.push('pageerror ' + String(e).slice(0, 220)))
const wait = (ms) => new Promise((r) => setTimeout(r, ms))
const res = {}
await page.goto((process.env.QA_ORIGIN || 'http://localhost:5173') + '/concepts/command/', { waitUntil: 'networkidle2', timeout: 60000 })
await wait(3000)

// 1. Pause motion
const pauseSel = 'button.cmd-pause'
const pauseBtns = await page.$$(pauseSel)
res.pauseButtons = pauseBtns.length
for (const b of pauseBtns) {
  const vis = await b.evaluate((el) => el.getBoundingClientRect().width > 0)
  if (vis) { await b.click(); break }
}
await wait(500)
res.pausedAttr = await page.evaluate(() => document.documentElement.dataset.motion)
res.pauseLabel = await page.evaluate(() => [...document.querySelectorAll('button.cmd-pause')].map((b) => b.textContent.trim() + '|' + b.getBoundingClientRect().width).join(' ; '))
// un-pause
for (const b of await page.$$(pauseSel)) { const vis = await b.evaluate((el) => el.getBoundingClientRect().width > 0); if (vis) { await b.click(); break } }
await wait(300)
res.unpausedAttr = (await page.evaluate(() => document.documentElement.dataset.motion)) ?? null

// 2. Mobile menu
if (width < 1024) {
  await page.click('button[aria-controls="cmd-menu"]')
  await wait(600)
  res.menuOpen = await page.evaluate(() => document.getElementById('cmd-menu').hidden === false)
  await page.screenshot({ path: `${out}${tag}-menu.png` })
  await page.keyboard.press('Escape')
  await wait(300)
  res.menuClosedByEsc = await page.evaluate(() => document.getElementById('cmd-menu').hidden === true)
  res.focusBackOnButton = await page.evaluate(() => document.activeElement?.getAttribute('aria-controls') === 'cmd-menu')
}

// 3. Deployments tabs: ESS, then Agent demo, with keyboard
await page.evaluate(() => document.querySelector('#deployments').scrollIntoView({ behavior: 'instant' }))
await wait(1200)
const tabs = await page.$$('#deployments [role="tab"]')
res.tabCount = tabs.length
if (tabs.length >= 3) {
  await tabs[1].click()
  await wait(3000)
  await page.evaluate(() => window.scrollBy(0, 330))
  await wait(800)
  await page.screenshot({ path: `${out}${tag}-ess.png` })
  await tabs[1].focus()
  await page.keyboard.press('ArrowDown')
  await wait(1500)
  res.afterArrow = await page.evaluate(() => document.activeElement?.textContent.slice(0, 40))
  res.selectedAfterArrow = await page.evaluate(() => [...document.querySelectorAll('#deployments [role="tab"]')].map((t) => t.getAttribute('aria-selected')).join(','))
  await page.screenshot({ path: `${out}${tag}-agent.png` })
}

// 4. Hover a module row (desktop)
if (width >= 1024) {
  await page.evaluate(() => document.querySelector('#modules ol li:nth-child(2)').scrollIntoView({ behavior: 'instant', block: 'center' }))
  await wait(1500)
  const li = await page.$('#modules ol li:nth-child(2)')
  const box = await li.boundingBox()
  await page.mouse.move(box.x + 300, box.y + box.height / 2)
  await wait(900)
  await page.screenshot({ path: `${out}${tag}-hover.png` })
}

// 5. horizontal overflow of the ESS wide screen on small widths
res.pageOverflowX = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)
res.logs = [...new Set(logs)]
console.log(JSON.stringify(res, null, 1))
await browser.close()

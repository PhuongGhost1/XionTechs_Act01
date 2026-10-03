/* global window, document, getComputedStyle, NodeFilter */
/*
 * QA gate for Concept 01 v2 (X / COMMAND): docs/concepts/command-v2/00-direction.md, 13.2 and 13.3.
 *
 * What it does, in order:
 *   1. builds the site with `vite build` into a temp folder (or reuses --dist) and serves it from a
 *      tiny static node http server on 127.0.0.1 (no new dependency);
 *   2. reports the bundle (entry JS, WebGL chunk, CSS, fonts, images; gzip sizes) and FAILS on a
 *      budget breach: entry JS 95 kB, WebGL chunk 180 kB, CSS 14 kB, fonts 120 kB;
 *   3. opens the built page in headless Edge (puppeteer-core) at 320, 390, 768, 1024, 1280 and 1920,
 *      and per width: screenshots the first screen and every `main > section[id]`, checks that the
 *      page does not scroll sideways, that exactly one h1 exists, that the console has no errors
 *      and that no request failed;
 *   4. scans the built concepts/command/index.html and the rendered page text (default, ?review and
 *      ?view=raw) for the strings of doc 12.3, and checks that no request leaves the page's own
 *      host and that no cookie is set.
 * Exit code 0 means every gate passed, 1 means at least one finding. Warnings never fail the run.
 *
 * Usage (run from PowerShell on Windows: Edge does not launch from Git Bash):
 *   node scripts/command-qa.mjs [--out <folder>] [--dist <built folder>] [--widths 320,390,...]
 *                               [--edge <msedge.exe>] [--keep-build] [--forbid <text>]...
 *                               [--budget-entry <kB>] [--budget-webgl <kB>] [--budget-css <kB>]
 *                               [--budget-fonts <kB>]
 *   --out     where the PNGs and qa-report.json go (default: <temp>/command-qa-out)
 *   --dist    use an existing build instead of running vite (it is not deleted afterwards)
 *   --forbid  an extra forbidden string, matched as plain text (repeatable). With the budget flags
 *             this is how to prove the failure mode: `--budget-css 1` or `--forbid "GET IT DONE"`.
 *
 * How the entry JS is counted: the entry is the module script of concepts/command/index.html plus
 * every chunk it imports statically (its modulepreload links and their static imports). Vite puts
 * the React runtime into a chunk shared with the main page; that chunk is told apart by React's
 * internal marker string (__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED) in its text, not by
 * its file name. The budget applies to the entry WITHOUT that chunk; the number WITH it is printed
 * too, and a warning is raised if it alone exceeds the budget (doc 13.3 counts React inside 95 kB).
 * Chunks reached only through dynamic import() are lazy: the one holding three.js (told apart by
 * three's own class-name strings) is the WebGL chunk. All sizes are gzip, 1 kB = 1000 bytes (as vite).
 */
import { spawn } from 'node:child_process'
import { createReadStream, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import http from 'node:http'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'
import puppeteer from 'puppeteer-core'

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const PAGE = '/concepts/command/'
const DEFAULT_EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
const HEIGHTS = { 320: 640, 390: 844, 768: 1024, 1024: 768, 1280: 800, 1920: 1080 }
const MARKER_REACT = '__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED'

// ---------------------------------------------------------------------------------------------
// Arguments
// ---------------------------------------------------------------------------------------------

function parseArgs(argv) {
  const opts = { out: path.join(os.tmpdir(), 'command-qa-out'), widths: Object.keys(HEIGHTS).map(Number), forbid: [], keepBuild: false, budgets: {} }
  const need = (i, flag) => {
    if (i + 1 >= argv.length) throw new Error(`${flag} needs a value`)
    return argv[i + 1]
  }
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i]
    if (a === '--out') opts.out = path.resolve(need(i++, a))
    else if (a === '--dist') opts.dist = path.resolve(need(i++, a))
    else if (a === '--edge') opts.edge = need(i++, a)
    else if (a === '--widths') opts.widths = need(i++, a).split(',').map((n) => Number(n.trim())).filter((n) => n > 0)
    else if (a === '--forbid') opts.forbid.push(need(i++, a))
    else if (a === '--keep-build') opts.keepBuild = true
    else if (a.startsWith('--budget-')) opts.budgets[a.slice('--budget-'.length)] = Number(need(i++, a))
    else if (a === '--help' || a === '-h') opts.help = true
    else throw new Error(`unknown argument ${a} (try --help)`)
  }
  return opts
}

const opts = (() => {
  try {
    return parseArgs(process.argv.slice(2))
  } catch (error) {
    console.error(String(error.message ?? error))
    process.exit(2)
  }
})()

if (opts.help) {
  console.log('See the comment at the top of scripts/command-qa.mjs for usage.')
  process.exit(0)
}

// kB budgets of doc 13.3, overridable to prove the failure mode.
const BUDGET = {
  entry: opts.budgets.entry ?? 95,
  webgl: opts.budgets.webgl ?? 180,
  css: opts.budgets.css ?? 14,
  fonts: opts.budgets.fonts ?? 120,
}

const failures = []
const warnings = []
const fail = (area, message) => failures.push({ area, message })
const warn = (area, message) => warnings.push({ area, message })
const kb = (bytes) => `${(bytes / 1000).toFixed(2)} kB`
const gz = (buffer) => gzipSync(buffer, { level: 9 }).length

// ---------------------------------------------------------------------------------------------
// Build and serve
// ---------------------------------------------------------------------------------------------

function runVite(outDir) {
  return new Promise((resolve, reject) => {
    // Resolve vite's own bin, so no shell and no npx are involved (portable, no quoting issues).
    const require = createRequire(path.join(REPO, 'package.json'))
    const pkgPath = require.resolve('vite/package.json')
    const bin = path.join(path.dirname(pkgPath), JSON.parse(readFileSync(pkgPath, 'utf8')).bin.vite)
    const child = spawn(process.execPath, [bin, 'build', '--outDir', outDir, '--emptyOutDir'], { cwd: REPO, stdio: ['ignore', 'pipe', 'pipe'] })
    let log = ''
    child.stdout.on('data', (d) => (log += d))
    child.stderr.on('data', (d) => (log += d))
    child.on('error', reject)
    child.on('close', (code) => (code === 0 ? resolve(log) : reject(new Error(`vite build failed (exit ${code})\n${log.slice(-2000)}`))))
  })
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.woff2': 'font/woff2',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml',
}

function serve(root) {
  const server = http.createServer((req, res) => {
    try {
      const pathname = decodeURIComponent(new URL(req.url, 'http://local').pathname)
      let file = path.normalize(path.join(root, pathname))
      if (file !== root && !file.startsWith(root + path.sep)) {
        res.writeHead(403).end('forbidden')
        return
      }
      if (existsSync(file) && statSync(file).isDirectory()) file = path.join(file, 'index.html')
      if (!existsSync(file)) {
        res.writeHead(404, { 'content-type': 'text/plain' }).end('not found')
        return
      }
      res.writeHead(200, { 'content-type': MIME[path.extname(file)] ?? 'application/octet-stream', 'cache-control': 'no-store' })
      createReadStream(file).pipe(res)
    } catch {
      res.writeHead(400).end('bad request')
    }
  })
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve({ server, port: server.address().port })))
}

// ---------------------------------------------------------------------------------------------
// Bundle report
// ---------------------------------------------------------------------------------------------

// Reads every attribute of the tags named `name` in an html string.
function tagsOf(html, name) {
  return [...html.matchAll(new RegExp(`<${name}\\b([^>]*)>`, 'gi'))].map((m) => {
    const attrs = {}
    for (const a of m[1].matchAll(/([\w:-]+)\s*=\s*"([^"]*)"/g)) attrs[a[1]] = a[2]
    return attrs
  })
}

const stripSlash = (url) => url.replace(/^\//, '')
const readText = (file) => readFileSync(file, 'utf8')

function bundleReport(dist) {
  const htmlFile = path.join(dist, 'concepts/command/index.html')
  const html = readText(htmlFile)
  const entries = tagsOf(html, 'script').filter((t) => t.type === 'module' && t.src).map((t) => stripSlash(t.src))
  const links = tagsOf(html, 'link')
  const preloads = links.filter((t) => t.rel === 'modulepreload').map((t) => stripSlash(t.href))
  const sheets = links.filter((t) => t.rel === 'stylesheet').map((t) => stripSlash(t.href))
  if (!entries.length) throw new Error('concepts/command/index.html has no module script: is this a built page?')

  const chunk = (rel) => {
    const file = path.join(dist, rel)
    const buffer = readFileSync(file)
    return { rel, size: buffer.length, gzip: gz(buffer), text: buffer.toString('utf8') }
  }
  const cache = new Map()
  const get = (rel) => {
    if (!cache.has(rel)) cache.set(rel, chunk(rel))
    return cache.get(rel)
  }
  const resolveSibling = (from, name) => path.posix.normalize(path.posix.join(path.posix.dirname(from), name))

  const staticDeps = (rel) => [...get(rel).text.matchAll(/(?:\bfrom|\bimport)\s*["']\.\/([^"']+\.js)["']/g)].map((m) => resolveSibling(rel, `./${m[1]}`))
  const dynamicDeps = (rel) => [...get(rel).text.matchAll(/\bimport\(\s*["']\.\/([^"']+\.js)["']\s*\)/g)].map((m) => resolveSibling(rel, `./${m[1]}`))

  // Static closure: the entry plus everything it imports without import().
  const statics = new Set()
  const visit = (rel) => {
    if (statics.has(rel) || !existsSync(path.join(dist, rel))) return
    statics.add(rel)
    staticDeps(rel).forEach(visit)
  }
  ;[...entries, ...preloads].forEach(visit)

  // Lazy closure: reached by import(), minus what is already static.
  const lazy = new Set()
  const visitLazy = (rel) => {
    if (statics.has(rel) || lazy.has(rel) || !existsSync(path.join(dist, rel))) return
    lazy.add(rel)
    staticDeps(rel).forEach(visitLazy)
    dynamicDeps(rel).forEach(visitLazy)
  }
  for (const rel of [...statics]) dynamicDeps(rel).forEach(visitLazy)

  const isReact = (c) => c.text.includes(MARKER_REACT)
  const isThree = (c) => ['isShaderMaterial', 'isBufferGeometry', 'WebGL2RenderingContext', 'isPoints'].filter((m) => c.text.includes(m)).length >= 2

  const staticChunks = [...statics].map(get)
  const reactChunks = staticChunks.filter(isReact)
  const appChunks = staticChunks.filter((c) => !isReact(c))
  const lazyChunks = [...lazy].map(get)
  const webglChunks = lazyChunks.filter(isThree)
  const otherLazy = lazyChunks.filter((c) => !isThree(c))
  const sum = (list, key) => list.reduce((n, c) => n + c[key], 0)

  // CSS: the stylesheets in the page, plus any css named by the command chunks (lazy css).
  const cssNames = new Set(sheets)
  for (const c of [...staticChunks, ...lazyChunks]) for (const m of c.text.matchAll(/assets\/[\w.-]+\.css/g)) cssNames.add(m[0])
  const cssChunks = [...cssNames].filter((rel) => existsSync(path.join(dist, rel))).map(get)

  // Fonts: woff2 files named by those stylesheets or preloaded by the page.
  const fontNames = new Set(links.filter((t) => t.as === 'font').map((t) => stripSlash(t.href)))
  for (const c of cssChunks) for (const m of c.text.matchAll(/url\(\s*["']?\/?([^)"']+\.woff2)["']?\s*\)/g)) fontNames.add(resolveSibling(c.rel, `./${m[1]}`).replace(/^\.\//, ''))
  const fonts = [...fontNames].map((rel) => (existsSync(path.join(dist, rel)) ? { rel, size: statSync(path.join(dist, rel)).size } : null)).filter(Boolean)

  // Images: raster files under dist that the page's own code names.
  const haystack = [html, ...staticChunks.map((c) => c.text), ...lazyChunks.map((c) => c.text), ...cssChunks.map((c) => c.text)].join('\n')
  const images = []
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      const full = path.join(dir, name)
      if (statSync(full).isDirectory()) walk(full)
      else if (/\.(webp|png|jpe?g|avif|gif)$/i.test(name)) {
        const rel = path.relative(dist, full).split(path.sep).join('/')
        if (rel.startsWith('assets/') || haystack.includes(`/${rel}`) || haystack.includes(name)) {
          const buffer = readFileSync(full)
          images.push({ rel, size: buffer.length, gzip: gz(buffer) })
        }
      }
    }
  }
  walk(dist)

  return {
    html,
    entries,
    react: reactChunks.map((c) => ({ rel: c.rel, size: c.size, gzip: c.gzip })),
    app: appChunks.map((c) => ({ rel: c.rel, size: c.size, gzip: c.gzip })),
    webgl: webglChunks.map((c) => ({ rel: c.rel, size: c.size, gzip: c.gzip })),
    lazyOther: otherLazy.map((c) => ({ rel: c.rel, size: c.size, gzip: c.gzip })),
    css: cssChunks.map((c) => ({ rel: c.rel, size: c.size, gzip: c.gzip })),
    fonts,
    images,
    totals: {
      entryExclReact: sum(appChunks, 'gzip'),
      react: sum(reactChunks, 'gzip'),
      webgl: sum(webglChunks, 'gzip'),
      css: sum(cssChunks, 'gzip'),
      fonts: fonts.reduce((n, f) => n + f.size, 0),
    },
  }
}

function printBundle(b) {
  const line = (label, list) => {
    for (const c of list) console.log(`  ${label.padEnd(16)} ${c.rel.padEnd(46)} ${kb(c.size).padStart(11)} raw ${kb(c.gzip).padStart(11)} gzip`)
  }
  console.log('\nBUNDLE (gzip, 1 kB = 1000 bytes)')
  line('entry (app)', b.app)
  line('React runtime', b.react)
  line('WebGL (lazy)', b.webgl)
  line('lazy other', b.lazyOther)
  line('css', b.css)
  for (const f of b.fonts) console.log(`  ${'font'.padEnd(16)} ${f.rel.padEnd(46)} ${kb(f.size).padStart(11)} raw`)
  for (const i of b.images) console.log(`  ${'image'.padEnd(16)} ${i.rel.padEnd(46)} ${kb(i.size).padStart(11)} raw ${kb(i.gzip).padStart(11)} gzip`)
  const t = b.totals
  const row = (name, value, budget) => console.log(`  ${name.padEnd(34)} ${kb(value).padStart(11)}   budget ${String(budget).padStart(4)} kB   ${value / 1000 <= budget ? 'ok' : 'OVER'}`)
  console.log('')
  row('entry JS (without React runtime)', t.entryExclReact, BUDGET.entry)
  console.log(`  ${'entry JS with the React runtime'.padEnd(34)} ${kb(t.entryExclReact + t.react).padStart(11)}   (React alone ${kb(t.react)})`)
  if (b.webgl.length) row('WebGL chunk', t.webgl, BUDGET.webgl)
  else console.log(`  ${'WebGL chunk'.padEnd(34)} ${'none'.padStart(11)}   budget ${String(BUDGET.webgl).padStart(4)} kB   not built yet (CoreCanvas is a stub)`)
  row('CSS', t.css, BUDGET.css)
  row('fonts (woff2, raw)', t.fonts, BUDGET.fonts)
}

function checkBudgets(b) {
  const t = b.totals
  if (t.entryExclReact / 1000 > BUDGET.entry) fail('bundle', `entry JS ${kb(t.entryExclReact)} gzip is over the ${BUDGET.entry} kB budget`)
  else if ((t.entryExclReact + t.react) / 1000 > BUDGET.entry) warn('bundle', `entry JS with the React runtime is ${kb(t.entryExclReact + t.react)} gzip, over ${BUDGET.entry} kB (doc 13.3 counts React inside the budget)`)
  if (t.webgl / 1000 > BUDGET.webgl) fail('bundle', `WebGL chunk ${kb(t.webgl)} gzip is over the ${BUDGET.webgl} kB budget`)
  if (t.css / 1000 > BUDGET.css) fail('bundle', `CSS ${kb(t.css)} gzip is over the ${BUDGET.css} kB budget`)
  if (t.fonts / 1000 > BUDGET.fonts) fail('bundle', `fonts ${kb(t.fonts)} are over the ${BUDGET.fonts} kB budget`)
  if (!b.react.length) warn('bundle', 'no chunk with the React runtime was found; the entry figure includes React')
}

// ---------------------------------------------------------------------------------------------
// Forbidden strings (doc 12.3) and extra checks
// ---------------------------------------------------------------------------------------------

// Words are matched whole. PRODUCTION is case sensitive on purpose: the premise statement says
// "production systems" (lowercase, BRIEF copy); only the capitalised word is a status.
const FORBIDDEN = [
  ['ONLINE', /\bONLINE\b/i],
  ['AVAILABLE', /\bAVAILABLE\b/i],
  ['PRODUCTION (status)', /\bPRODUCTION\b/],
  ['SUCCESS', /\bSUCCESS\b/i],
  ['UPTIME', /\bUPTIME\b/i],
  ['98%', /98\s?%/],
  ['99.8%', /99\.8\s?%/],
  ['#4821', /#4821/],
  ['projects delivered', /projects delivered/i],
  ['Lorem', /lorem/i],
  ['.NET', /\.NET\b/],
  ['React', /\bReact\b/],
  ...opts.forbid.map((text) => [`"${text}" (--forbid)`, new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))]),
]

function scanText(where, text) {
  for (const [name, re] of FORBIDDEN) {
    const match = re.exec(text)
    if (match) {
      const at = match.index
      fail('forbidden string', `${name} found in ${where}: ...${text.slice(Math.max(0, at - 30), at + 40).replace(/\s+/g, ' ')}...`)
    }
  }
}

// ---------------------------------------------------------------------------------------------
// Browser
// ---------------------------------------------------------------------------------------------

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function openPage(browser, origin, width, query = '') {
  const page = await browser.newPage()
  await page.setViewport({ width, height: HEIGHTS[width] ?? 800, deviceScaleFactor: 1, isMobile: width < 700, hasTouch: width < 700 })
  const seen = { requests: [], consoleErrors: [], pageErrors: [], failed: [], badStatus: [] }
  page.on('request', (r) => seen.requests.push(r.url()))
  page.on('console', (m) => {
    if (m.type() === 'error') seen.consoleErrors.push(m.text().slice(0, 240))
  })
  page.on('pageerror', (e) => seen.pageErrors.push(String(e).slice(0, 300)))
  page.on('requestfailed', (r) => seen.failed.push(`${r.url()} (${r.failure()?.errorText ?? 'failed'})`))
  page.on('response', (r) => {
    if (r.status() >= 400) seen.badStatus.push(`${r.status()} ${r.url()}`)
  })
  await page.goto(`${origin}${PAGE}${query}`, { waitUntil: 'networkidle0', timeout: 60000 })
  await page.waitForSelector('main > section[id]', { timeout: 15000 })
  await page.evaluate(() => document.fonts?.ready)
  await sleep(1200)
  return { page, seen }
}

// Everything the visitor can read, without script and style, plus the text carried by attributes.
function readableText() {
  const root = document.body.cloneNode(true)
  root.querySelectorAll('script, style, noscript, template').forEach((n) => n.remove())
  const attrs = [...root.querySelectorAll('[alt], [title], [aria-label], [placeholder]')].flatMap((n) => ['alt', 'title', 'aria-label', 'placeholder'].map((a) => n.getAttribute(a)).filter(Boolean))
  // mailto links carry the whole email template in their href: it is copy too.
  const mails = [...root.querySelectorAll('a[href^="mailto:"]')].map((a) => {
    try {
      return decodeURIComponent(a.getAttribute('href'))
    } catch {
      return a.getAttribute('href')
    }
  })
  return `${root.textContent}\n${attrs.join('\n')}\n${mails.join('\n')}`
}

async function checkPage(page, seen, width, origin, label) {
  const host = new URL(origin).host
  const where = `${width}px${label ? ` ${label}` : ''}`

  const facts = await page.evaluate(() => {
    const de = document.documentElement
    const wide = []
    for (const el of document.querySelectorAll('body *')) {
      const r = el.getBoundingClientRect()
      const cs = getComputedStyle(el)
      if (r.width > 0 && r.right > de.clientWidth + 1 && cs.position !== 'fixed' && cs.visibility !== 'hidden') {
        const cls = typeof el.className === 'string' ? el.className.slice(0, 60) : ''
        wide.push(`${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ''}.${cls} right=${Math.round(r.right)}`)
      }
    }
    // Text smaller than 12 px and tap targets smaller than 44 px: warnings, they never fail the run.
    const small = new Set()
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const el = n.parentElement
      if (!el || !n.textContent.trim() || el.closest('script, style, noscript, .sr-only')) continue
      const r = el.getBoundingClientRect()
      const px = parseFloat(getComputedStyle(el).fontSize)
      if (r.width > 0 && r.height > 0 && px < 12) small.add(`${el.tagName.toLowerCase()} ${px}px "${n.textContent.trim().slice(0, 24)}"`)
    }
    const tiny = []
    for (const el of document.querySelectorAll('a[href], button, input, textarea, select, summary, [role="button"]')) {
      // A checkbox or radio is tapped through its label, so the label's box is the target.
      const box = /^(checkbox|radio)$/.test(el.type ?? '') ? el.labels?.[0] ?? el.closest('label') ?? el : el
      const r = box.getBoundingClientRect()
      if (r.width === 0 || r.height === 0 || el.closest('.sr-only')) continue
      if (r.height < 44 || r.width < 44) {
        // Inline links inside a sentence are exempt (WCAG 2.5.8), so only list blocks and buttons.
        if (getComputedStyle(el).display !== 'inline') tiny.push(`${el.tagName.toLowerCase()} ${Math.round(r.width)}x${Math.round(r.height)} "${(el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 24)}"`)
      }
    }
    const logos = [...document.querySelectorAll('img[data-logo]')].map((i) => ({ w: i.getBoundingClientRect().width, nat: i.naturalWidth, src: i.getAttribute('src') }))
    return {
      scrollW: de.scrollWidth,
      clientW: de.clientWidth,
      h1: document.querySelectorAll('h1').length,
      wide: wide.slice(0, 8),
      small: [...small].slice(0, 6),
      tiny: tiny.slice(0, 8),
      logos,
      cookie: document.cookie,
      sections: [...document.querySelectorAll('main > section[id]')].map((s) => s.id),
    }
  })

  if (facts.scrollW > facts.clientW) fail('horizontal scroll', `${where}: the page is ${facts.scrollW}px wide in a ${facts.clientW}px viewport. Culprits: ${facts.wide.join('; ') || 'none listed'}`)
  if (facts.h1 !== 1) fail('headings', `${where}: expected exactly one h1, found ${facts.h1}`)
  for (const logo of facts.logos) if (logo.nat && logo.w > logo.nat + 0.5) fail('logo', `${where}: ${logo.src} is drawn ${Math.round(logo.w)}px wide but its file is ${logo.nat}px (never upscale the logo)`)
  for (const e of seen.consoleErrors) fail('console', `${where}: ${e}`)
  for (const e of seen.pageErrors) fail('console', `${where}: uncaught ${e}`)
  for (const e of seen.failed) fail('request', `${where}: failed ${e}`)
  for (const e of seen.badStatus) fail('request', `${where}: ${e}`)
  for (const url of seen.requests) {
    let u
    try {
      u = new URL(url)
    } catch {
      continue
    }
    if ((u.protocol === 'http:' || u.protocol === 'https:' || u.protocol === 'ws:' || u.protocol === 'wss:') && u.host !== host) fail('third party', `${where}: request to ${u.host} (${url})`)
  }
  if (facts.cookie) fail('cookies', `${where}: document.cookie is not empty`)
  if (facts.small.length) warn('text size', `${where}: below 12px: ${facts.small.join('; ')}`)
  if (facts.tiny.length) warn('tap target', `${where}: under 44px: ${facts.tiny.join('; ')}`)
  return facts
}

async function shoot(page, dir, width, sections) {
  const files = []
  const take = async (name) => {
    const file = path.join(dir, `${width}-${name}.png`)
    await page.screenshot({ path: file })
    files.push(file)
  }
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
  await sleep(500)
  await take('00-first')
  let n = 1
  for (const id of sections) {
    await page.evaluate((sel) => {
      const header = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 56
      const el = document.getElementById(sel)
      window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - header, behavior: 'instant' })
    }, id)
    await sleep(800)
    await take(`${String(n).padStart(2, '0')}-${id}`)
    n += 1
  }
  await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }))
  await sleep(800)
  await take(`${String(n).padStart(2, '0')}-end`)
  return files
}

async function allCookies(page) {
  const client = await page.createCDPSession()
  const { cookies } = await client.send('Network.getAllCookies')
  await client.detach()
  return cookies
}

// ---------------------------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------------------------

async function main() {
  const started = Date.now()
  mkdirSync(opts.out, { recursive: true })
  const edge = opts.edge ?? DEFAULT_EDGE
  if (!existsSync(edge)) throw new Error(`Edge not found at ${edge}; pass --edge <path to msedge.exe>`)

  let dist = opts.dist
  let tempBuild = null
  if (!dist) {
    tempBuild = mkdtempSync(path.join(os.tmpdir(), 'command-qa-build-'))
    dist = tempBuild
    console.log(`Building into ${dist} ...`)
    await runVite(dist)
  }
  if (!existsSync(path.join(dist, 'concepts/command/index.html'))) throw new Error(`${dist} has no concepts/command/index.html`)

  // 1. Bundle.
  const bundle = bundleReport(dist)
  printBundle(bundle)
  checkBudgets(bundle)

  // 2. The built html, before any script runs.
  scanText('the built concepts/command/index.html', bundle.html)

  // 3. Browser runs.
  const { server, port } = await serve(dist)
  const origin = `http://127.0.0.1:${port}`
  const userDataDir = mkdtempSync(path.join(os.tmpdir(), 'command-qa-profile-'))
  const browser = await puppeteer.launch({
    executablePath: edge,
    headless: 'shell',
    userDataDir,
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'],
  })
  const report = { origin, widths: {}, shots: [] }
  // The rendered text is the same at every width, so it is scanned once (1280 if asked for).
  const textWidth = opts.widths.includes(1280) ? 1280 : opts.widths[opts.widths.length - 1]
  try {
    for (const width of opts.widths) {
      const { page, seen } = await openPage(browser, origin, width)
      const facts = await checkPage(page, seen, width, origin)
      report.widths[width] = { scrollW: facts.scrollW, clientW: facts.clientW, h1: facts.h1, sections: facts.sections }
      if (width === textWidth) {
        scanText(`the rendered page at ${width}px`, await page.evaluate(readableText))
        const cookies = await allCookies(page)
        if (cookies.length) fail('cookies', `${cookies.length} cookie(s) set: ${cookies.map((c) => c.name).join(', ')}`)
      }
      report.shots.push(...(await shoot(page, opts.out, width, facts.sections)))
      console.log(`  ${String(width).padStart(4)}px  scrollWidth ${facts.scrollW}/${facts.clientW}  h1 ${facts.h1}  sections ${facts.sections.join(' ')}`)
      await page.close()
    }
    // The review and RAW variants show other text (offices, DRAFT marks, the plain sheet): scan it too.
    for (const [query, label] of [['?review', 'with ?review'], ['?view=raw', 'in RAW view']]) {
      const { page, seen } = await openPage(browser, origin, 1280, query)
      await checkPage(page, seen, 1280, origin, label)
      scanText(`the rendered page ${label}`, await page.evaluate(readableText))
      await page.close()
    }
  } finally {
    await browser.close().catch(() => {})
    server.close()
    for (const dir of [userDataDir, tempBuild && !opts.keepBuild ? tempBuild : null]) {
      if (dir) {
        try {
          rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 })
        } catch {
          // A locked Edge profile on Windows is not worth failing the run for.
        }
      }
    }
  }

  // 4. Result.
  const summary = { ok: failures.length === 0, seconds: Math.round((Date.now() - started) / 1000), failures, warnings, bundle: { ...bundle, html: undefined }, ...report }
  writeFileSync(path.join(opts.out, 'qa-report.json'), JSON.stringify(summary, null, 2))
  console.log(`\nScreenshots: ${report.shots.length} files in ${opts.out}`)
  if (warnings.length) {
    console.log(`\nWARNINGS (${warnings.length}, they do not fail the run)`)
    for (const w of warnings) console.log(`  [${w.area}] ${w.message}`)
  }
  if (failures.length) {
    console.log(`\nFAILED: ${failures.length} finding(s)`)
    for (const f of failures) console.log(`  [${f.area}] ${f.message}`)
    process.exitCode = 1
  } else {
    console.log(`\nPASSED: every gate is green (${summary.seconds}s)`)
  }
}

main().catch((error) => {
  console.error(`\nQA could not run: ${error.stack ?? error}`)
  process.exitCode = 1
})

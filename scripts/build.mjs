#!/usr/bin/env node
/**
 * Offline build: copy the app into dist/ and vendor CDN assets for kiosk / air-gapped use.
 * Vendored files are cached under vendor/ so rebuilds work without network when cache is warm.
 */
import {
  cpSync,
  mkdirSync,
  rmSync,
  readFileSync,
  writeFileSync,
  existsSync,
  statSync
} from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'
import { tmpdir } from 'node:os'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const DIST = join(ROOT, 'dist')
const VENDOR_CACHE = join(ROOT, 'vendor')
const PORT = process.env.GLOW_PORT || '8080'

const VENDOR_FILES = [
  {
    url: 'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/codemirror.min.js',
    path: 'codemirror/codemirror.min.js'
  },
  {
    url: 'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/mode/javascript/javascript.min.js',
    path: 'codemirror/mode/javascript/javascript.min.js'
  },
  {
    url: 'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/addon/hint/show-hint.min.js',
    path: 'codemirror/addon/hint/show-hint.min.js'
  },
  {
    url: 'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/addon/hint/javascript-hint.min.js',
    path: 'codemirror/addon/hint/javascript-hint.min.js'
  },
  {
    url: 'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/addon/hint/anyword-hint.min.js',
    path: 'codemirror/addon/hint/anyword-hint.min.js'
  },
  {
    url: 'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/codemirror.min.css',
    path: 'codemirror/codemirror.min.css'
  },
  {
    url: 'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/theme/material-darker.min.css',
    path: 'codemirror/theme/material-darker.min.css'
  },
  {
    url: 'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/addon/hint/show-hint.min.css',
    path: 'codemirror/addon/hint/show-hint.min.css'
  },
  {
    url: 'https://cdn.jsdelivr.net/npm/gpu-io@0.2.3/dist/gpu-io.min.js',
    path: 'gpu-io.min.js'
  },
  {
    url: 'https://cdn.jsdelivr.net/npm/marked@15.0.7/marked.min.js',
    path: 'marked.min.js'
  },
  {
    url: 'https://cdn.jsdelivr.net/npm/grained@0.0.2/grained.min.js',
    path: 'grained.min.js'
  },
  {
    url: 'https://unpkg.com/@0b5vr/tweakpane-plugin-rotation@0.2.0/dist/tweakpane-plugin-rotation.js',
    path: 'tweakpane-plugin-rotation.js'
  },
]

const FONT_FACES = [
  {
    weight: 200,
    url: 'https://fonts.gstatic.com/s/inconsolata/v37/QldgNThLqRwH-OJ1UHjlKENVzkWGVkL3GZQmAwLYxYWI2qfdm7LppwU8aRo.ttf',
    file: 'Inconsolata-200.ttf'
  },
  {
    weight: 300,
    url: 'https://fonts.gstatic.com/s/inconsolata/v37/QldgNThLqRwH-OJ1UHjlKENVzkWGVkL3GZQmAwLYxYWI2qfdm7Lpp9s8aRo.ttf',
    file: 'Inconsolata-300.ttf'
  },
  {
    weight: 400,
    url: 'https://fonts.gstatic.com/s/inconsolata/v37/QldgNThLqRwH-OJ1UHjlKENVzkWGVkL3GZQmAwLYxYWI2qfdm7Lpp4U8aRo.ttf',
    file: 'Inconsolata-400.ttf'
  },
  {
    weight: 500,
    url: 'https://fonts.gstatic.com/s/inconsolata/v37/QldgNThLqRwH-OJ1UHjlKENVzkWGVkL3GZQmAwLYxYWI2qfdm7Lpp7c8aRo.ttf',
    file: 'Inconsolata-500.ttf'
  },
  {
    weight: 600,
    url: 'https://fonts.gstatic.com/s/inconsolata/v37/QldgNThLqRwH-OJ1UHjlKENVzkWGVkL3GZQmAwLYxYWI2qfdm7Lpp1s7aRo.ttf',
    file: 'Inconsolata-600.ttf'
  },
  {
    weight: 700,
    url: 'https://fonts.gstatic.com/s/inconsolata/v37/QldgNThLqRwH-OJ1UHjlKENVzkWGVkL3GZQmAwLYxYWI2qfdm7Lpp2I7aRo.ttf',
    file: 'Inconsolata-700.ttf'
  },
  {
    weight: 800,
    url: 'https://fonts.gstatic.com/s/inconsolata/v37/QldgNThLqRwH-OJ1UHjlKENVzkWGVkL3GZQmAwLYxYWI2qfdm7LppwU7aRo.ttf',
    file: 'Inconsolata-800.ttf'
  },
  {
    weight: 900,
    url: 'https://fonts.gstatic.com/s/inconsolata/v37/QldgNThLqRwH-OJ1UHjlKENVzkWGVkL3GZQmAwLYxYWI2qfdm7Lppyw7aRo.ttf',
    file: 'Inconsolata-900.ttf'
  }
]

const COPY_ENTRIES = [
  'src',
  'assets',
  'fonts',
  'midi-mappings',
  'sw.js',
  'USER_MANUAL.md',
  'index.html',
  'controls.html'
]

async function download (url, dest) {
  mkdirSync(dirname(dest), { recursive: true })
  const underDistVendor = dest.startsWith(join(DIST, 'vendor'))
  const cachePath = underDistVendor
    ? join(VENDOR_CACHE, relative(join(DIST, 'vendor'), dest))
    : dest

  if (existsSync(cachePath) && statSync(cachePath).size > 0) {
    if (cachePath !== dest) cpSync(cachePath, dest)
    return 'cache'
  }

  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed ${res.status} ${url}`)
  const buf = Buffer.from(await res.arrayBuffer())
  writeFileSync(dest, buf)
  if (cachePath !== dest) {
    mkdirSync(dirname(cachePath), { recursive: true })
    writeFileSync(cachePath, buf)
  }
  return 'download'
}

function rewriteHtml (html) {
  return html
    .replace(
      /<link\s+rel="preconnect"\s+href="https:\/\/fonts\.googleapis\.com"\s*\/?>\s*/g,
      ''
    )
    .replace(
      /<link\s+rel="preconnect"\s+href="https:\/\/fonts\.gstatic\.com"[^>]*>\s*/g,
      ''
    )
    .replace(
      /<link\s+href="https:\/\/fonts\.googleapis\.com\/css2\?family=Inconsolata[^"]*"\s+rel="stylesheet"\s*\/?>/,
      '<link rel="stylesheet" href="vendor/fonts/inconsolata.css" />'
    )
    .replace(
      'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/codemirror.min.css',
      'vendor/codemirror/codemirror.min.css'
    )
    .replace(
      'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/theme/material-darker.min.css',
      'vendor/codemirror/theme/material-darker.min.css'
    )
    .replace(
      'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/addon/hint/show-hint.min.css',
      'vendor/codemirror/addon/hint/show-hint.min.css'
    )
    .replace(
      'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/codemirror.min.js',
      'vendor/codemirror/codemirror.min.js'
    )
    .replace(
      'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/mode/javascript/javascript.min.js',
      'vendor/codemirror/mode/javascript/javascript.min.js'
    )
    .replace(
      'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/addon/hint/show-hint.min.js',
      'vendor/codemirror/addon/hint/show-hint.min.js'
    )
    .replace(
      'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/addon/hint/javascript-hint.min.js',
      'vendor/codemirror/addon/hint/javascript-hint.min.js'
    )
    .replace(
      'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/addon/hint/anyword-hint.min.js',
      'vendor/codemirror/addon/hint/anyword-hint.min.js'
    )
    .replace(
      /https:\/\/cdn\.jsdelivr\.net\/npm\/gpu-io@[^/]+\/dist\/gpu-io\.min\.js/,
      'vendor/gpu-io.min.js'
    )
    .replace(
      /https:\/\/cdn\.jsdelivr\.net\/npm\/marked(?:\/marked\.min\.js|@[^/]+\/marked\.min\.js)/,
      'vendor/marked.min.js'
    )
    .replace(
      'https://cdn.jsdelivr.net/npm/grained@0.0.2/grained.min.js',
      'vendor/grained.min.js'
    )
    .replace(
      'https://unpkg.com/ionicons@5.5.2/dist/ionicons/ionicons.esm.js',
      'vendor/ionicons/ionicons.esm.js'
    )
    .replace(
      'https://unpkg.com/ionicons@5.5.2/dist/ionicons/ionicons.js',
      'vendor/ionicons/ionicons.js'
    )
}

async function vendorIoniconsPackage (destDir) {
  const cacheTgz = join(VENDOR_CACHE, 'ionicons-5.5.2.tgz')
  if (!existsSync(cacheTgz) || statSync(cacheTgz).size === 0) {
    const how = await download(
      'https://registry.npmjs.org/ionicons/-/ionicons-5.5.2.tgz',
      cacheTgz
    )
    console.log(`  ionicons package (${how})`)
  } else {
    console.log('  ionicons package (cache)')
  }

  const extractRoot = join(tmpdir(), `glow-ionicons-${process.pid}`)
  rmSync(extractRoot, { recursive: true, force: true })
  mkdirSync(extractRoot, { recursive: true })
  execFileSync('tar', ['-xzf', cacheTgz, '-C', extractRoot])

  const pkgDist = join(extractRoot, 'package/dist/ionicons')
  if (!existsSync(pkgDist)) {
    throw new Error('ionicons tarball missing dist/ionicons')
  }
  mkdirSync(destDir, { recursive: true })
  cpSync(pkgDist, destDir, { recursive: true })
  rmSync(extractRoot, { recursive: true, force: true })
}

function patchDistSources () {
  const trackUi = join(DIST, 'src/components/track-ui-manager.js')
  let src = readFileSync(trackUi, 'utf8')
  src = src.replace(
    "import * as RotationPlugin from 'https://unpkg.com/@0b5vr/tweakpane-plugin-rotation@0.2.0/dist/tweakpane-plugin-rotation.js'",
    "import * as RotationPlugin from '../lib/tweakpane-plugin-rotation.js'"
  )
  writeFileSync(trackUi, src)

  // Copy rotation plugin next to other tweakpane libs
  cpSync(
    join(DIST, 'vendor/tweakpane-plugin-rotation.js'),
    join(DIST, 'src/lib/tweakpane-plugin-rotation.js')
  )

  const vendorFontCss = FONT_FACES.map(
    (f) => `@font-face {
  font-family: 'Inconsolata';
  font-style: normal;
  font-weight: ${f.weight};
  font-stretch: normal;
  font-display: swap;
  src: url(./${f.file}) format('truetype');
}`
  ).join('\n')
  writeFileSync(join(DIST, 'vendor/fonts/inconsolata.css'), vendorFontCss + '\n')

  const libFontCss = FONT_FACES.map(
    (f) => `@font-face {
  font-family: 'Inconsolata';
  font-style: normal;
  font-weight: ${f.weight};
  font-stretch: normal;
  font-display: swap;
  src: url(../../../vendor/fonts/${f.file}) format('truetype');
}`
  ).join('\n')
  writeFileSync(join(DIST, 'src/lib/fonts/inconsolata.css'), libFontCss + '\n')
}

function writeBuildMeta () {
  writeFileSync(
    join(DIST, 'build.json'),
    JSON.stringify(
      {
        builtAt: new Date().toISOString(),
        port: PORT,
        offline: true
      },
      null,
      2
    ) + '\n'
  )
}

async function main () {
  console.log('Building offline dist/ …')
  rmSync(DIST, { recursive: true, force: true })
  mkdirSync(DIST, { recursive: true })
  mkdirSync(VENDOR_CACHE, { recursive: true })

  for (const entry of COPY_ENTRIES) {
    const from = join(ROOT, entry)
    if (!existsSync(from)) {
      console.warn(`skip missing ${entry}`)
      continue
    }
    cpSync(from, join(DIST, entry), { recursive: true })
  }

  for (const file of VENDOR_FILES) {
    const dest = join(DIST, 'vendor', file.path)
    const how = await download(file.url, dest)
    console.log(`  vendor ${file.path} (${how})`)
  }

  for (const font of FONT_FACES) {
    const dest = join(DIST, 'vendor/fonts', font.file)
    const how = await download(font.url, dest)
    console.log(`  font ${font.file} (${how})`)
  }

  await vendorIoniconsPackage(join(DIST, 'vendor/ionicons'))
  console.log('  ionicons extracted')

  for (const page of ['index.html', 'controls.html']) {
    const path = join(DIST, page)
    if (!existsSync(path)) continue
    writeFileSync(path, rewriteHtml(readFileSync(path, 'utf8')))
  }

  patchDistSources()
  writeBuildMeta()

  // Sanity: no leftover CDN refs in built HTML
  const index = readFileSync(join(DIST, 'index.html'), 'utf8')
  const cdnHits = index.match(/https?:\/\/(?:cdn|unpkg|fonts\.)/g)
  if (cdnHits) {
    console.warn('Warning: dist/index.html still references remote URLs:', [
      ...new Set(cdnHits)
    ])
  }

  console.log(`Done → ${DIST}`)
  console.log(`Serve with: npm run serve:dist   (http://127.0.0.1:${PORT})`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

import { mkdir, rm, cp, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const repoRoot = join(process.cwd(), '..')
const srcDocs = join(repoRoot, 'docs')
const dstContent = join(process.cwd(), 'content')

await mkdir(dstContent, { recursive: true })

// Clean content (but keep _meta.json if present)
for (const entry of await (async () => {
  try {
    return await (await import('node:fs/promises')).readdir(dstContent)
  } catch {
    return []
  }
})()) {
  if (entry === '_meta.json') continue
  await rm(join(dstContent, entry), { recursive: true, force: true })
}

await cp(srcDocs, dstContent, { recursive: true })

// Ensure we have a root index.mdx for Nextra.
// GitBook uses docs/index.md — we mirror it as content/index.mdx.
try {
  const indexMd = await readFile(join(dstContent, 'index.md'), 'utf8')
  await writeFile(join(dstContent, 'index.mdx'), indexMd)
} catch {
  // ignore
}


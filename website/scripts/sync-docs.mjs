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
// We intentionally do NOT mirror MkDocs' landing page, since it contains
// MkDocs-specific markup (icons/cards) that won't render nicely in Nextra.
// Instead, use the clean GitBook "Getting Started" overview as the homepage.
try {
  const overviewMd = await readFile(
    join(dstContent, 'getting-started', 'overview.md'),
    'utf8'
  )
  const homepage = `# Getting Started\n\n${overviewMd.trim()}\n`
  await writeFile(join(dstContent, 'index.mdx'), homepage)
} catch {
  // ignore
}


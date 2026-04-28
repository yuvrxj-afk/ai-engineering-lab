import nextra from 'nextra'

const withNextra = nextra({
  // Keep it default: content directory convention.
})

const repo = 'ai-engineering-lab'

export default withNextra({
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  basePath: `/${repo}`,
  assetPrefix: `/${repo}/`
})


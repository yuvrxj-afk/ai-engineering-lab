import { Footer, Layout, Navbar } from 'nextra-theme-docs'
import { Head } from 'nextra/components'
import { getPageMap } from 'nextra/page-map'
import 'nextra-theme-docs/style.css'

export const metadata = {
  title: {
    template: '%s – AI Engineering Lab',
    default: 'AI Engineering Lab'
  },
  icons: {
    icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }]
  }
}

const navbar = <Navbar logo={<b>AI Engineering Lab</b>} />
const footer = <Footer>MIT {new Date().getFullYear()} © AI Engineering Lab.</Footer>

export default async function RootLayout({ children }) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <Head />
      <body>
        <Layout
          navbar={navbar}
          pageMap={await getPageMap()}
          footer={footer}
          docsRepositoryBase="https://github.com/yuvrxj-afk/ai-engineering-lab/tree/main/docs"
        >
          {children}
        </Layout>
      </body>
    </html>
  )
}


import { routing } from '@/i18n/routing'
import { renderOgImage } from '@/lib/og'

// /og/fr.png and /og/en.png: share previews at a fixed, absolute address. The dot in the path keeps
// them out of the language middleware (see proxy.ts); any other file name is a 404.
export const dynamicParams = false

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ file: `${locale}.png` }))
}

export async function GET(_request: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params
  return renderOgImage(file.replace(/\.png$/, ''))
}

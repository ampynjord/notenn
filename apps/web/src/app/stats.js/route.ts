/**
 * Loads the Umami statistics script when the server is configured for it (UMAMI_SCRIPT_URL and
 * UMAMI_WEBSITE_ID, read at request time so the same image works with or without statistics).
 */
export const dynamic = 'force-dynamic'

export function GET() {
  const src = process.env.UMAMI_SCRIPT_URL
  const id = process.env.UMAMI_WEBSITE_ID
  const body =
    src && id
      ? `(function(){var s=document.createElement('script');s.defer=true;s.src=${JSON.stringify(src)};s.dataset.websiteId=${JSON.stringify(id)};s.dataset.doNotTrack='true';document.head.appendChild(s)})();`
      : '/* statistics disabled */'
  return new Response(body, { headers: { 'content-type': 'text/javascript; charset=utf-8', 'cache-control': 'public, max-age=3600' } })
}

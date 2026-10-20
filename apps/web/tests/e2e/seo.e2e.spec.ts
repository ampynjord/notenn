import { expect, test } from '@playwright/test'

const BASE = 'http://localhost:3000'
// Canonical addresses always use the public host, whatever address served the page.
const PUBLIC = 'https://notenn.ampynjord.bzh'

test.describe('Search engines', () => {
  test('robots.txt allows the site, hides the back office and points at the sitemap', async ({ request }) => {
    const res = await request.get(`${BASE}/robots.txt`)
    expect(res.status()).toBe(200)
    const text = await res.text()
    expect(text).toContain('Allow: /')
    expect(text).toContain('Disallow: /admin')
    expect(text).toContain(`Sitemap: ${PUBLIC}/sitemap.xml`)
  })

  test('sitemap.xml lists the public pages and the tunes in both languages, but not the account area', async ({
    request,
  }) => {
    const res = await request.get(`${BASE}/sitemap.xml`)
    expect(res.status()).toBe(200)
    const xml = await res.text()
    for (const path of ['/fr', '/en', '/fr/airs', '/en/tunes', '/fr/airs/au-clair-de-la-lune', '/en/tunes/au-clair-de-la-lune'])
      expect(xml).toContain(`<loc>${PUBLIC}${path}</loc>`)
    expect(xml).toContain('hreflang="x-default"')
    expect(xml).not.toMatch(/compte|account|bibliotheque|library/)
  })

  test('a tune page has its own title, canonical address, language alternates and structured data', async ({
    page,
  }) => {
    await page.goto(`${BASE}/fr/airs/au-clair-de-la-lune`)
    await expect(page).toHaveTitle(/Au clair de la lune.*tablature.*accordéon diatonique.*Notenn/)
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `${PUBLIC}/fr/airs/au-clair-de-la-lune`)
    await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute(
      'href',
      `${PUBLIC}/en/tunes/au-clair-de-la-lune`,
    )
    const blocks = await page.locator('script[type="application/ld+json"]').allTextContents()
    const types = blocks.map((b) => (JSON.parse(b) as { '@type': string })['@type'])
    expect(types).toEqual(expect.arrayContaining(['MusicComposition', 'BreadcrumbList']))
  })

  test('a tune has a full text in each language and a description short enough for a search result', async ({
    page,
  }) => {
    await page.goto(`${BASE}/en/tunes/the-kesh`)
    const intro = await page.locator('.intro').innerText()
    expect(intro).toMatch(/Irish jig in G major/)
    expect(intro.length).toBeGreaterThan(120)
    const description = (await page.locator('meta[name="description"]').getAttribute('content')) ?? ''
    expect(description.length).toBeLessThanOrEqual(156)
    expect(intro.startsWith(description.replace(/…$/, ''))).toBe(true)

    await page.goto(`${BASE}/fr/airs/the-kesh`)
    await expect(page.locator('.intro')).toContainText('Gigue irlandaise en Sol majeur')
  })

  test('the home page announces what it is, in each language', async ({ page }) => {
    await page.goto(`${BASE}/fr`)
    await expect(page).toHaveTitle(/^Notenn : tablatures d'accordéon diatonique$/)
    await page.goto(`${BASE}/en`)
    await expect(page).toHaveTitle(/^Notenn: diatonic accordion tabs$/)
    await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute('content', 'en_GB')
  })

  test('the share preview is a real image at a fixed address', async ({ page, request }) => {
    await page.goto(`${BASE}/fr`)
    const url = await page.locator('meta[property="og:image"]').getAttribute('content')
    expect(url).toBe(`${PUBLIC}/og/fr.png`)
    const image = await request.get(`${BASE}/og/fr.png`)
    expect(image.status()).toBe(200)
    expect(image.headers()['content-type']).toContain('image/png')
    expect((await request.get(`${BASE}/og/de.png`)).status()).toBe(404)
  })

  test('the account area stays out of the index', async ({ page }) => {
    await page.goto(`${BASE}/fr/compte/connexion`)
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/)
  })
})

import { expect, test } from '@playwright/test'

test.describe('Frontend', () => {
  test('redirects to a language and shows the home page', async ({ page }) => {
    await page.goto('http://localhost:3000')
    await expect(page).toHaveURL(/\/(fr|en)$/)
    await expect(page).toHaveTitle(/Notenn/)
    await expect(page.locator('.hero-tab svg').first()).toBeVisible()
  })

  test('serves the workshop in both languages', async ({ page }) => {
    await page.goto('http://localhost:3000/fr/atelier')
    await expect(page.locator('h1').first()).toHaveText('Atelier')
    await page.goto('http://localhost:3000/en/workshop')
    await expect(page.locator('h1').first()).toHaveText('Workshop')
  })

  test('lists the library and opens a tune', async ({ page }) => {
    await page.goto('http://localhost:3000/fr/airs')
    await page.getByRole('link', { name: /Au clair de la lune/ }).click()
    await expect(page.locator('h1').first()).toHaveText('Au clair de la lune')
    await expect(page.locator('.score svg').first()).toBeVisible()
  })
})

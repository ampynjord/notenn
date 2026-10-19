import { expect, test } from '@playwright/test'

test.describe('Frontend', () => {
  test('redirects to a language and shows the home page', async ({ page }) => {
    await page.goto('http://localhost:3000')
    await expect(page).toHaveURL(/\/(fr|en)$/)
    await expect(page).toHaveTitle(/Notenn/)
    await expect(page.locator('h1').first()).toHaveText('Notenn')
  })

  test('serves the workshop in both languages', async ({ page }) => {
    await page.goto('http://localhost:3000/fr/atelier')
    await expect(page.locator('h1').first()).toHaveText('Atelier')
    await page.goto('http://localhost:3000/en/workshop')
    await expect(page.locator('h1').first()).toHaveText('Workshop')
  })
})

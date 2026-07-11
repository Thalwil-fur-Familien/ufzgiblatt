import { test, expect } from '@playwright/test';
import { blockExternal } from './helpers.js';

test.describe('Language Switching & State Preservation', () => {
    test.beforeEach(async ({ page }) => {
        await blockExternal(page);
    });

    test('should load state from URL including language', async ({ page }) => {
        // Navigate with all parameters: English, Grade 2, Rechenmauer 4, Count 5, Seed 999
        await page.goto('/?grade=2&topic=rechenmauer_4&count=5&seed=999&lang=en');

        await expect(page.locator('html')).toHaveAttribute('lang', 'en');
        await expect(page.locator('#pageCount')).toHaveValue('5');

        // Verify Topic Selection (English Text)
        await expect(page.locator('#topicSelector')).toHaveValue('rechenmauer_4');
        const selectedOption = page.locator('#topicSelector option:checked');
        await expect(selectedOption).toHaveText(/Number Pyramids/);

        // The inactive DE button carries the full state as a link
        await expect(page.locator('#lang-de-header')).toHaveAttribute('href', /lang=de/);
        await expect(page.locator('#lang-de-header')).toHaveAttribute('href', /seed=999/);
    });

    test('should switch language and preserve all parameters', async ({ page }) => {
        // 1. Initial Load (English)
        await page.goto('/?grade=2&topic=rechenmauer_4&count=5&seed=999&lang=en');

        // 2. Click switch to German
        await page.click('#lang-de-header');

        // 3. Verify URL keeps all parameters with the new language
        await expect(page).toHaveURL(/lang=de/);
        await expect(page).toHaveURL(/count=5/);
        await expect(page).toHaveURL(/seed=999/);
        await expect(page).toHaveURL(/topic=rechenmauer_4/);

        // 4. Verify UI Text (German)
        await expect(page.locator('html')).toHaveAttribute('lang', 'de');
        const selectedOption = page.locator('#topicSelector option:checked');
        await expect(selectedOption).toHaveText(/Rechenmauern/);

        // 5. Verify Inputs remained same
        await expect(page.locator('#pageCount')).toHaveValue('5');
    });

    test('should default to German if no lang specified', async ({ page }) => {
        // The Playwright locale is pinned to de-CH in the config
        await page.goto('/');
        await expect(page.locator('html')).toHaveAttribute('lang', 'de');
        // The EN button is the inactive one, offering the switch
        await expect(page.locator('#lang-en-header')).toHaveAttribute('href', /lang=en/);
    });
});

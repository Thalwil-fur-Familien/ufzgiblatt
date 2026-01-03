import { test, expect } from '@playwright/test';

test.describe('Seamless Language Switching & State Preservation', () => {

    test('should load state from URL including language', async ({ page }) => {
        // Navigate with all parameters: English, Grade 2, Rechenmauer 4, Count 5, Seed 999
        await page.goto('/?grade=2&topic=rechenmauer_4&count=5&seed=999&lang=en');

        // Verify Page Count
        await expect(page.locator('#pageCount')).toHaveValue('5');

        // Verify Topic Selection (English Text)
        // Note: The value stays 'rechenmauer_4', text changes.
        await expect(page.locator('#topicSelector')).toHaveValue('rechenmauer_4');
        const selectedOption = page.locator('#topicSelector option:checked');
        await expect(selectedOption).toHaveText(/Number Pyramids/);

        // Verify Language Toggle (should show "DE" because we are in EN)
        await expect(page.locator('#langLinkHeader')).toHaveText('DE');
    });

    test('should switch language and preserve all parameters', async ({ page }) => {
        // 1. Initial Load (English)
        await page.goto('/?grade=2&topic=rechenmauer_4&count=5&seed=999&lang=en');

        // 2. Click switch to German
        await page.click('#langLinkHeader');

        // 3. Verify URL updates to lang=de
        // Wait for URL to change (history.pushState happens almost instantly, but valid to check)
        await expect(page).toHaveURL(/lang=de/);
        await expect(page).toHaveURL(/count=5/);
        await expect(page).toHaveURL(/seed=999/);
        await expect(page).toHaveURL(/topic=rechenmauer_4/);

        // 4. Verify UI Text (German)
        const selectedOption = page.locator('#topicSelector option:checked');
        await expect(selectedOption).toHaveText(/Rechenmauern/); // German text
        await expect(page.locator('#langLinkHeader')).toHaveText('EN'); // Toggle should now say EN

        // 5. Verify Inputs remained same
        await expect(page.locator('#pageCount')).toHaveValue('5');
    });

    test('should default to German if no lang specified', async ({ page }) => {
        await page.goto('/');
        await expect(page.locator('html')).toHaveAttribute('lang', 'de');
        await expect(page.locator('#langLinkHeader')).toHaveText('EN');
    });
});

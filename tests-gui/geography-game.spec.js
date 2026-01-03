import { test, expect } from '@playwright/test';

test.describe('Geography Game & Language Persistence', () => {

    test.beforeEach(async ({ page }) => {
        // Clear local storage to start fresh
        await page.goto('/');
        await page.evaluate(() => localStorage.clear());
    });

    test('should load the game and confirm default elements', async ({ page }) => {
        await page.goto('/geography-game.html');
        await expect(page).toHaveTitle(/Kanton Master/);
        await expect(page.locator('#map-container svg')).toBeVisible();
        await expect(page.locator('#mode-selector')).toHaveValue('find');
    });

    test('should switch modes correctly', async ({ page }) => {
        await page.goto('/geography-game.html');

        // Switch to "Name to Flag"
        await page.selectOption('#mode-selector', 'flag');

        // Verify Flag container visible, Map hidden
        await expect(page.locator('#flag-container')).toBeVisible();
        await expect(page.locator('#map-container')).toBeHidden();

        // Switch back to "Find"
        await page.selectOption('#mode-selector', 'find');
        await expect(page.locator('#map-container')).toBeVisible();
        await expect(page.locator('#flag-container')).toBeHidden();
    });

    test('should persist language selection across reload', async ({ page }) => {
        // 1. Start on German page
        await page.goto('/');
        await expect(page.locator('#langLinkHeader')).toHaveText('EN'); // Toggle shows target EN

        // 2. Switch to English
        await page.click('#langLinkHeader');
        await expect(page).toHaveURL(/lang=en/);

        // 3. Reload Page
        await page.reload();

        // 4. Verify English is still active (local storage check implicitly via UI)
        await expect(page.locator('#langLinkHeader')).toHaveText('DE'); // Toggle shows target DE
        await expect(page.locator('.sheet h1')).toHaveText(/Worksheet Generator/); // English Title
    });

    test('should load correct game language based on preference', async ({ page }) => {
        // 1. Set preference to English via main site
        await page.goto('/?lang=en');

        // 2. Navigate to Game
        await page.goto('/geography-game.html');

        // 3. Should show English text (local storage preference)
        await expect(page.locator('h1#game-instruction')).toHaveText(/Initializing/); // English text
    });

    test('should update preference when switching language inside game', async ({ page }) => {
        // 1. Go to German Game
        await page.goto('/geography-game.html');

        // 2. Click "EN" link
        await page.click('.lang-link'); // "EN"

        // 3. Should navigate to ?lang=en
        await expect(page).toHaveURL(/\?lang=en/);
        await expect(page.locator('h1#game-instruction')).toHaveText(/Initializing/);

        // 4. Go back to main site (root)
        await page.goto('/');

        // 5. Main site should now be in English because we set preference in Game
        // BUT main site logic: check `getPreferredLanguage()`.
        // Script.js runs before HTML content? `lang` variable init uses `getPreferredLanguage`.
        // So it should render English.

        // Check HTML lang attribute or UI text
        await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    });

});

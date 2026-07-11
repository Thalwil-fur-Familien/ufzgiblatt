import { test, expect } from '@playwright/test';
import { blockExternal } from './helpers.js';

test.describe('Geography Game & Language Persistence', () => {

    test.beforeEach(async ({ page }) => {
        await blockExternal(page);
        // Clear local storage to start fresh
        await page.goto('/');
        await page.evaluate(() => localStorage.clear());
    });

    test('should load the game and confirm default elements', async ({ page }) => {
        await page.goto('/geography-game.html');
        await expect(page).toHaveTitle(/Geographie/);
        await expect(page.locator('#map-container svg')).toBeVisible();
        await expect(page.locator('#mode-selector')).toHaveValue('find');
        await expect(page.locator('#game-instruction')).toContainText(/Klicke auf/);
    });

    test('should switch modes correctly', async ({ page }) => {
        await page.goto('/geography-game.html');

        // Switch to "Fahnen zuordnen" (flag mode)
        await page.selectOption('#mode-selector', 'flag');

        // Verify Flag container visible, Map hidden
        await expect(page.locator('#flag-container')).toBeVisible();
        await expect(page.locator('#map-container')).toBeHidden();
        // Flag tiles must not reuse the SVG path ids (prefixed instead)
        await expect(page.locator('.flag-item').first()).toHaveId(/^flag-/);

        // Switch back to "Find"
        await page.selectOption('#mode-selector', 'find');
        await expect(page.locator('#map-container')).toBeVisible();
        await expect(page.locator('#flag-container')).toBeHidden();
    });

    test('should persist language selection across reload', async ({ page }) => {
        // 1. Switch to English on the main page
        await page.click('#lang-en-header');
        await expect(page).toHaveURL(/lang=en/);
        // Wait until the English page has actually initialized (it stores the preference)
        await expect(page.locator('html')).toHaveAttribute('lang', 'en');

        // 2. Open the main page fresh, without URL parameters
        await page.goto('/');

        // 3. English must still be active (via localStorage preference)
        await expect(page.locator('html')).toHaveAttribute('lang', 'en');
        const selectedOption = page.locator('#topicSelector option:checked');
        await expect(selectedOption).toHaveText(/Addition/);
    });

    test('should load correct game language based on preference', async ({ page }) => {
        // 1. Set preference to English via main site
        await page.goto('/?lang=en');

        // 2. Navigate to Game (no lang param)
        await page.goto('/geography-game.html');

        // 3. Should show English text (local storage preference)
        await expect(page.locator('#game-instruction')).toContainText(/Click on/);
    });

    test('should update preference when switching language inside game', async ({ page }) => {
        // 1. Go to German Game
        await page.goto('/geography-game.html');
        await expect(page.locator('#game-instruction')).toContainText(/Klicke auf/);

        // 2. Click "EN" link
        await page.click('#lang-en');

        // 3. Should navigate to ?lang=en and show English
        await expect(page).toHaveURL(/lang=en/);
        await expect(page.locator('#game-instruction')).toContainText(/Click on/);

        // 4. Go back to main site (root, no params)
        await page.goto('/');

        // 5. Main site should now be in English (preference was set in the game)
        await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    });
});

import { test, expect } from '@playwright/test';
import { blockExternal } from './helpers.js';

test.describe('Geography Game Footer', () => {
    test.beforeEach(async ({ page }) => {
        await blockExternal(page);
    });

    test('should have the correct footer structure and content', async ({ page }) => {
        await page.goto('/geography-game.html');

        // Check for feedback button
        const feedbackBtn = page.locator('.feedback-button');
        await expect(feedbackBtn).toBeVisible();
        await expect(feedbackBtn).toHaveAttribute('href', 'https://github.com/Thalwil-fur-Familien/ufzgiblatt/issues/new');

        // Check for build info
        const buildInfo = page.locator('#build-info');
        await expect(buildInfo).toBeVisible();
        await expect(buildInfo).toHaveText(/Build|Development/);

        // Check for GitHub icon
        await expect(page.locator('.github-icon')).toBeVisible();
    });

    test('should translate footer content when language is switched', async ({ page }) => {
        // Start in DE (default via de-CH locale)
        await page.goto('/geography-game.html');
        await expect(page.locator('#labelFeedback')).toHaveText(/Feedback & Fehler melden/);

        // Switch to EN via the game's language link
        await page.click('#lang-en');
        await expect(page).toHaveURL(/lang=en/);
        await expect(page.locator('#labelFeedback')).toHaveText(/Feedback & Report Bugs/);
    });
});

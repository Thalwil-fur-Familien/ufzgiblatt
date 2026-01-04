import { test, expect } from '@playwright/test';

test.describe('Geography Game Footer Alignment', () => {

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
        // Start in DE (default)
        await page.goto('/geography-game.html');
        await expect(page.locator('#labelFeedback')).toHaveText(/Feedback & Fehler melden/);

        // Switch to EN
        await page.click('#langLinkHeader');
        await expect(page).toHaveURL(/\?lang=en/);
        await expect(page.locator('#labelFeedback')).toHaveText(/Feedback & Report Bugs/);
        await expect(page.locator('#buildInfo')).toHaveText(/Build Info/);
    });
});

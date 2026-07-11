import { test, expect } from '@playwright/test';
import { blockExternal } from './helpers.js';

// Parse the displayed question and compute the expected answer,
// so tests exercise the real task flow end-to-end.
function solve(question) {
    let m = question.match(/^(\d+)\s*\+\s*\?\s*=\s*(\d+)$/);
    if (m) return Number(m[2]) - Number(m[1]);
    m = question.match(/^(\d+)\s*([+\-×:])\s*(\d+)\s*=$/);
    if (!m) throw new Error(`Unparsable question: ${question}`);
    const a = Number(m[1]), b = Number(m[3]);
    switch (m[2]) {
        case '+': return a + b;
        case '-': return a - b;
        case '×': return a * b;
        case ':': return a / b;
    }
}

test.describe('Practice & Earn (screen time mode)', () => {
    test.beforeEach(async ({ page }) => {
        await blockExternal(page);
        await page.goto('/practice.html');
        await page.evaluate(() => localStorage.clear());
    });

    test('should load the setup screen in German', async ({ page }) => {
        await expect(page).toHaveTitle(/Bildschirmzeit/);
        await expect(page.locator('#setup-screen')).toBeVisible();
        await expect(page.locator('#btn-start')).toBeVisible();
        await expect(page.locator('#practice-grade option')).toHaveCount(6);
    });

    test('should show task worth and award minutes for a correct first-try answer', async ({ page }) => {
        await page.click('#btn-start');
        await expect(page.locator('#task-screen')).toBeVisible();

        // The task's worth is displayed before answering
        await expect(page.locator('#task-worth')).toContainText(/Min/);

        const question = (await page.locator('#task-question').textContent()).trim();
        await page.fill('#task-input', String(solve(question)));
        await page.click('#btn-check');

        await expect(page.locator('#task-feedback')).toHaveClass(/correct/);
        await expect(page.locator('#task-feedback')).toContainText('+');
        // Progress shows earned minutes > 0
        await expect(page.locator('#progress-label')).not.toContainText('Verdient: 0 Min');

        // Next task resets the input
        await page.click('#btn-next');
        await expect(page.locator('#task-input')).toBeEnabled();
        await expect(page.locator('#task-input')).toHaveValue('');
    });

    test('should award nothing after two wrong attempts and reveal the solution', async ({ page }) => {
        await page.click('#btn-start');

        const wrong = '999999';
        await page.fill('#task-input', wrong);
        await page.click('#btn-check');
        await expect(page.locator('#task-feedback')).toHaveClass(/retry/);

        await page.fill('#task-input', wrong);
        await page.click('#btn-check');
        await expect(page.locator('#task-feedback')).toHaveClass(/incorrect/);

        // Nothing earned
        await expect(page.locator('#progress-label')).toContainText('Verdient: 0 Min');
    });

    test('should show a summary and log the session', async ({ page }) => {
        await page.click('#btn-start');

        // Solve two tasks
        for (let i = 0; i < 2; i++) {
            const question = (await page.locator('#task-question').textContent()).trim();
            await page.fill('#task-input', String(solve(question)));
            await page.click('#btn-check');
            await page.click('#btn-next');
        }

        await page.click('#btn-finish');
        await expect(page.locator('#summary-screen')).toBeVisible();
        await expect(page.locator('#summary-tasks')).toHaveText('2');
        await expect(page.locator('#summary-minutes')).toContainText('Min');

        // Session appears in the log on the setup screen
        await page.click('#btn-again');
        await expect(page.locator('#setup-screen')).toBeVisible();
        await expect(page.locator('#log-list .log-row')).toHaveCount(1);
    });

    test('should respect parent settings (rate affects task worth)', async ({ page }) => {
        await page.fill('#practice-rate', '2');
        await page.selectOption('#practice-grade', '1');
        await page.click('#btn-start');

        // Grade 1 easy topics have factor 1-1.5 => worth 2-3 minutes
        const worth = await page.locator('#task-worth').textContent();
        const minutes = parseFloat(worth.match(/([\d.]+)/)[1]);
        expect(minutes).toBeGreaterThanOrEqual(2);
        expect(minutes).toBeLessThanOrEqual(3);
    });
});

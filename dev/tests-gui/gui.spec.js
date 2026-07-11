import { test, expect } from '@playwright/test';
import { blockExternal } from './helpers.js';

test.describe('Worksheet Generator GUI', () => {
    test.beforeEach(async ({ page }) => {
        await blockExternal(page);
        await page.goto('/');
    });

    test('should load the page and render a title', async ({ page }) => {
        await expect(page).toHaveTitle(/ufzgiblatt/);
        const header = page.locator('.sheet h1');
        await expect(header).toBeVisible();
    });

    test('should update sheet when topic changes', async ({ page }) => {
        const initialTitle = await page.locator('.sheet h1').first().textContent();

        await page.selectOption('#topicSelector', 'sub_10');

        const newTitle = await page.locator('.sheet h1').first().textContent();
        expect(newTitle).not.toBe(initialTitle);
        expect(newTitle).toContain('Subtraktion bis 10');
    });

    test('should save and load a worksheet state', async ({ page }) => {
        // 1. Setup a specific state
        await page.selectOption('#gradeSelector', '2');
        await page.selectOption('#topicSelector', 'add_100_simple');
        await page.fill('#pageCount', '2');

        const originalSeed = new URL(page.url()).searchParams.get('seed');

        // 2. Save the state
        page.on('dialog', async dialog => {
            if (dialog.type() === 'prompt') {
                expect(dialog.message()).toContain('Bezeichnung für dieses Arbeitsblatt');
                await dialog.accept('Test Save Plan');
            } else if (dialog.type() === 'alert') {
                await dialog.dismiss();
            }
        });
        await page.click('.btn-save');

        // 3. Change the state to something else
        await page.selectOption('#gradeSelector', '1');
        await page.selectOption('#topicSelector', 'add_10');

        // 4. Load the saved state
        await page.click('.btn-saved');
        await expect(page.locator('#savedModal')).toBeVisible();

        const loadButton = page.locator('.saved-item:has-text("Test Save Plan") .btn-load');
        await loadButton.click();

        // 5. Verify restoration
        await expect(page.locator('#gradeSelector')).toHaveValue('2');
        await expect(page.locator('#topicSelector')).toHaveValue('add_100_simple');
        await expect(page.locator('#pageCount')).toHaveValue('2');

        const restoredSeed = new URL(page.url()).searchParams.get('seed');
        expect(restoredSeed).toBe(originalSeed);
    });

    test('should append solution sheets when solutions are enabled', async ({ page }) => {
        // Default: solutions checkbox is unchecked, one sheet
        await expect(page.locator('#solutionToggle')).not.toBeChecked();
        await expect(page.locator('.sheet')).toHaveCount(1);

        // Check solutions
        await page.check('#solutionToggle');

        // Verify URL contains solutions=1
        await expect(page).toHaveURL(/solutions=1/);

        // A solution sheet is appended after the problem sheet
        await expect(page.locator('.sheet')).toHaveCount(2);
        await expect(page.locator('.sheet h1').last()).toContainText('(Lösungen)');
        await expect(page.locator('.sheet h1').first()).not.toContainText('(Lösungen)');
    });

    test('should render content for "Individuelle Aufgaben" (custom topic)', async ({ page }) => {
        await page.selectOption('#topicSelector', 'custom');

        // Verify checkboxes appear
        await expect(page.locator('#customOptions')).toBeVisible();

        // Verify problems are rendered (not empty)
        const problems = page.locator('.problem');
        await expect(problems.first()).toBeVisible();
        const count = await problems.count();
        expect(count).toBeGreaterThan(0);
    });

    test('should clamp huge page counts from the URL', async ({ page }) => {
        await page.goto('/?grade=1&topic=add_10&count=99999');
        await expect(page.locator('#pageCount')).toHaveValue('50');
    });
});

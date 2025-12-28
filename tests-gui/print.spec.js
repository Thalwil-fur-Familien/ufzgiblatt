// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Print Functionality', () => {

    test('Print button should trigger window.print()', async ({ page }) => {
        // Navigate to the app
        await page.goto('http://localhost:3000');

        // Verify button is visible
        const printBtn = page.locator('#btnPrint');
        await expect(printBtn).toBeVisible();

        // Evaluate script to mock window.print
        // We do this because the native print dialog halts execution and cannot be interacted with by Playwright.
        await page.evaluate(() => {
            window._printCalled = false;
            window.print = () => {
                window._printCalled = true;
            };
        });

        // Click the print button
        await printBtn.click();

        // Check if our mock function was called
        const printCalled = await page.waitForFunction(() => window._printCalled, null, { timeout: 2000 });
        expect(printCalled).toBeTruthy();
    });

});

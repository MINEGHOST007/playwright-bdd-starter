import { expect } from '@playwright/test';
import { Given, When, Then } from './fixtures';

/**
 * Step definitions for login.feature
 * Uses the custom fixtures (loginPage) defined in fixtures.ts
 *
 * NOTE: These are sample steps targeting a hypothetical login page.
 * Update the page object locators and assertions for your real application.
 */

Given('I am on the login page', async ({ loginPage }) => {
    await loginPage.navigate();
});

When(
    'I enter username {string} and password {string}',
    async ({ loginPage }, username: string, password: string) => {
        await loginPage.login(username, password);
    }
);

When('I click the login button', async ({ loginPage }) => {
    await loginPage.page.getByRole('button', { name: 'Login' }).click();
});

Then('I should be redirected to the dashboard', async ({ page }) => {
    // Update this assertion to match your app's dashboard URL
    await expect(page).toHaveURL(/.*dashboard/);
});

Then('I should see an error message', async ({ loginPage }) => {
    const errorMsg = await loginPage.getErrorMessage();
    expect(errorMsg).toBeTruthy();
});

Then('I should see the result {string}', async ({ page }, result: string) => {
    // Placeholder assertion — customize based on your app's behavior
    if (result === 'success') {
        await expect(page).toHaveURL(/.*dashboard/);
    } else {
        await expect(page.locator('.error-message')).toBeVisible();
    }
});

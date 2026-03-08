import { test as setup } from '@playwright/test';

const authFile = 'playwright/.auth/user.json';

/**
 * This runs ONCE before all tests.
 * It logs in and saves the browser storage state to a JSON file.
 * All test projects that depend on 'setup' will reuse this auth state.
 *
 * Update the login flow below to match your real application.
 */
setup('authenticate', async ({ page }) => {
    // 1. Navigate to login page
    await page.goto('/login');

    // 2. Perform login
    await page.getByLabel('Username').fill('testuser');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Login' }).click();

    // 3. Wait for auth to complete (adjust to your app)
    await page.waitForURL('**/dashboard');

    // 4. Save signed-in state
    await page.context().storageState({ path: authFile });
});

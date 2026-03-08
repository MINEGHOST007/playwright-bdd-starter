import { expect } from '@playwright/test';
import { Given, When, Then } from './fixtures';

/**
 * Step definitions for home.feature
 * Uses the custom fixtures (homePage) defined in fixtures.ts
 */

Given('I am on the home page', async ({ homePage }) => {
    await homePage.navigate();
});

Then('I should see the page heading', async ({ homePage }) => {
    const heading = await homePage.getHeadingText();
    expect(heading).toBeTruthy();
});

When('I click the {string} link', async ({ homePage }) => {
    await homePage.clickGetStarted();
});

Then('I should be navigated to the getting started page', async ({ page }) => {
    await expect(page).toHaveURL(/.*intro/);
});

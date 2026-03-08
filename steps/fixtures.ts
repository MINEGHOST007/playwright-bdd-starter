import { test as base, createBdd } from 'playwright-bdd';
import { HomePage } from '../pages/HomePage';
import { LoginPage } from '../pages/LoginPage';

/**
 * Custom fixtures that extend playwright-bdd's base test.
 * Page objects are injected as fixtures so step definitions
 * can destructure them directly: async ({ homePage }) => { ... }
 */
export const test = base.extend<{
    homePage: HomePage;
    loginPage: LoginPage;
}>({
    homePage: async ({ page }, use) => {
        await use(new HomePage(page));
    },
    loginPage: async ({ page }, use) => {
        await use(new LoginPage(page));
    },
});

/**
 * Create BDD functions (Given, When, Then) bound to our custom test.
 * Import these in step definition files instead of from 'playwright-bdd'.
 */
export const { Given, When, Then } = createBdd(test);

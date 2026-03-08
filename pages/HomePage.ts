import { type Page, type Locator } from '@playwright/test';

/**
 * Page Object for the Home Page.
 * Encapsulates locators and actions for the homepage.
 */
export class HomePage {
    readonly page: Page;
    readonly getStartedLink: Locator;
    readonly heading: Locator;
    readonly navBar: Locator;

    constructor(page: Page) {
        this.page = page;
        this.heading = page.locator('h1');
        this.getStartedLink = page.getByRole('link', { name: 'Get started' });
        this.navBar = page.locator('nav');
    }

    async navigate() {
        await this.page.goto('/');
    }

    async clickGetStarted() {
        await this.getStartedLink.click();
    }

    async getHeadingText(): Promise<string | null> {
        return this.heading.textContent();
    }
}

# 🎭 Playwright BDD Starter

A production-ready starter template for **BDD testing** with [Playwright](https://playwright.dev) using [playwright-bdd](https://github.com/vitalets/playwright-bdd).

Write tests in **Gherkin** (`.feature` files) and run them with the **Playwright Test** runner — get the best of both worlds.

## 📁 Project Structure

```
├── features/              # Gherkin .feature files
│   ├── home.feature
│   └── login.feature
├── steps/                 # Step definitions + fixtures
│   ├── fixtures.ts        # Custom Playwright fixtures with Page Objects
│   ├── home.steps.ts
│   └── login.steps.ts
├── pages/                 # Page Object Model
│   ├── HomePage.ts
│   └── LoginPage.ts
├── playwright.config.ts   # Playwright + BDD configuration
├── package.json
└── tsconfig.json
```

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Install Playwright browsers
npx playwright install

# 3. Run all tests
npm test
```

## 📝 Available Scripts

| Script | Description |
|---|---|
| `npm test` | Generate tests from features & run them |
| `npm run test:generate` | Only generate Playwright tests from `.feature` files |
| `npm run test:headed` | Run tests in headed browser mode |
| `npm run test:ui` | Run tests in Playwright UI mode |
| `npm run test:debug` | Run tests in debug mode |
| `npm run test:report` | Open the HTML test report |

## 🔧 How It Works

1. **Write features** in Gherkin syntax inside `features/`
2. **Define steps** in TypeScript inside `steps/`
3. **`playwright-bdd`** auto-generates Playwright test files from your features
4. **Playwright Test** runs the generated tests with full runner capabilities

### Adding a New Feature

1. Create a `.feature` file in `features/`:
   ```gherkin
   Feature: My New Feature
     Scenario: Something happens
       Given I am on the page
       When I do something
       Then I should see the result
   ```

2. Create matching step definitions in `steps/`:
   ```typescript
   import { Given, When, Then } from './fixtures';

   Given('I am on the page', async ({ page }) => {
     await page.goto('/');
   });
   ```

3. Run `npm test`

## 🏗️ Page Object Model

Page objects live in `pages/` and are injected via Playwright fixtures in `steps/fixtures.ts`:

```typescript
// steps/fixtures.ts
import { test as base } from 'playwright-bdd';
import { MyPage } from '../pages/MyPage';

export const test = base.extend<{ myPage: MyPage }>({
  myPage: async ({ page }, use) => {
    await use(new MyPage(page));
  },
});

export const { Given, When, Then } = test;
```

## ⚙️ Configuration

- **`playwright.config.ts`** — Playwright + BDD settings, browsers, reporters
- **`.env.example`** — Environment variables (copy to `.env`)

## 📊 Reporting

Tests generate two reports:
- **Cucumber HTML Report** → `cucumber-report/report.html`
- **Playwright HTML Report** → `playwright-report/index.html` (open with `npm run test:report`)

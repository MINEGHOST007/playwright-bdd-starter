# Handling Popup Windows Across Steps in Playwright-BDD

## The Core Challenge

Playwright **natively** tracks every popup window. The challenge is BDD-specific: each step is an isolated function that only receives the original `page` fixture. You need a way to share popup `Page` references across steps — **especially when all popups share the same URI** (common in legacy .NET apps).

---

## Native Playwright Methods (No Custom Code)

Playwright provides **three** native ways to handle popups. Here's how each one works and when to use it.

### 1. `page.waitForEvent('popup')` — Capture Popup From a Specific Page

> **Official Playwright recommendation** — [docs](https://playwright.dev/docs/pages#handling-popups)

The popup event fires on the **page that triggered it**. This is the most precise method:

```typescript
// Start waiting BEFORE clicking. Note: no await on the first line.
const popupPromise = page.waitForEvent('popup');
await page.getByText('open the popup').click();
const popup = await popupPromise;

// Interact with the new popup normally
await popup.waitForLoadState();
await popup.getByRole('button').click();
console.log(await popup.title());
```

**When to use**: You know which page triggers the popup and which click causes it. **This is the recommended approach.**

### 2. `context.waitForEvent('page')` — Capture Any New Page in the Context

> **Official Playwright recommendation** — [docs](https://playwright.dev/docs/pages#handling-new-pages)

This listens at the context level — catches **any** new page/tab, regardless of which page triggered it:

```typescript
const pagePromise = context.waitForEvent('page');
await page.getByText('open new tab').click();
const newPage = await pagePromise;

await newPage.waitForLoadState();
await newPage.getByRole('button').click();
console.log(await newPage.title());
```

**When to use**: The popup opens from a context-level action, or you want a catch-all listener.

### 3. `page.on('popup')` / `context.on('page')` — Fire-and-Forget Listener

When the **triggering action is unknown** or popups can open at any time:

```typescript
// Listen to ALL popups from a specific page
page.on('popup', async popup => {
    await popup.waitForLoadState();
    console.log(await popup.title());
});

// OR listen to ALL new pages in the entire context
context.on('page', async page => {
    await page.waitForLoadState();
    console.log(await page.title());
});
```

**When to use**: You don't control when the popup opens (e.g., .NET timer-triggered popups).

### 4. `context.pages()` — List All Open Pages

Not an event — just a snapshot of all currently open pages:

```typescript
const allPages = context.pages();
// allPages[0] = original page
// allPages[1] = first popup
// allPages[2] = second popup
```

**When to use**: As a fallback to find pages by index. ⚠️ Array order isn't guaranteed to be meaningful.

---

## Comparison of All Methods

| Method | Level | Event-based? | Identifies which popup? | Best for |
|---|---|---|---|---|
| `page.waitForEvent('popup')` | Page | ✅ Yes | ✅ Exact popup from that page | **Recommended — most precise** |
| `context.waitForEvent('page')` | Context | ✅ Yes | ⚠️ Any new page | Catch-all, context-level triggers |
| `page.on('popup')` | Page | ✅ Listener | ✅ All popups from that page | Unknown timing, fire-and-forget |
| `context.on('page')` | Context | ✅ Listener | ⚠️ Any new page | Global listener |
| `context.pages()` | Context | ❌ Snapshot | ❌ By index only | Last resort, debugging |

---

## The BDD Problem: Sharing Across Steps

All native methods work perfectly **within a single function**. The problem in BDD is that the popup opens in **Step A** but you need to use it in **Step B**, **Step C**, etc. — which are separate functions.

```typescript
// Step A — captures the popup... but where does it go?
When('I click a link that opens a popup', async ({ page }) => {
    const popupPromise = page.waitForEvent('popup');
    await page.click('#link');
    const popup = await popupPromise;  // ← exists here only
});

// Step B — can't see `popup`, only gets original `page`
Then('I do work in the popup', async ({ page }) => {
    // ❌ `page` is still the original tab
});
```

**Solution**: Use a shared fixture to store the captured popup references.

---

## Solution: `popupContext` Shared Fixture

This is a thin wrapper around Playwright's native popup handling that stores references so all steps can access them.

### Step 1: Update `steps/fixtures.ts`

```typescript
import { type Page } from '@playwright/test';
import { test as base, createBdd } from 'playwright-bdd';
import { HomePage } from '../pages/HomePage';
import { LoginPage } from '../pages/LoginPage';

/**
 * Shared popup context — holds captured popup references.
 * Uses Playwright's native page.waitForEvent('popup') under the hood.
 */
export interface PopupContext {
    /** Stack of pages: [0] = original, [1] = first popup, ... */
    pages: Page[];
    /** Push a newly opened popup onto the stack */
    push(popup: Page): void;
    /** Pop the current popup and return it */
    pop(): Page;
    /** Get the currently active page (top of stack) */
    current(): Page;
    /** How deep in the popup chain (1 = original only) */
    depth(): number;
}

export const test = base.extend<{
    homePage: HomePage;
    loginPage: LoginPage;
    popupContext: PopupContext;
}>({
    homePage: async ({ page }, use) => {
        await use(new HomePage(page));
    },
    loginPage: async ({ page }, use) => {
        await use(new LoginPage(page));
    },
    popupContext: async ({ page }, use) => {
        const stack: Page[] = [page];
        await use({
            pages: stack,
            push(popup: Page) { stack.push(popup); },
            pop() {
                if (stack.length <= 1) throw new Error('Cannot pop the original page.');
                return stack.pop()!;
            },
            current() { return stack[stack.length - 1]; },
            depth() { return stack.length; },
        });
    },
});

export const { Given, When, Then } = createBdd(test);
```

### Step 2: Write Step Definitions That Use Native `waitForEvent`

#### `steps/navigation.steps.ts` — Opening & closing popups

```typescript
import { When } from './fixtures';

// Click a link → capture popup using native waitForEvent('popup')
When(
    'I click the {string} link that opens a new window',
    async ({ popupContext }, linkText: string) => {
        const currentPage = popupContext.current();

        // ★ Native Playwright — waitForEvent('popup')
        const popupPromise = currentPage.waitForEvent('popup');
        await currentPage.getByRole('link', { name: linkText }).click();
        const popup = await popupPromise;

        await popup.waitForLoadState('domcontentloaded');
        popupContext.push(popup);  // store for next steps
    }
);

// Nested popup — same pattern, from current popup
When(
    'I click the {string} link in the popup that opens another window',
    async ({ popupContext }, linkText: string) => {
        const currentPage = popupContext.current();

        const popupPromise = currentPage.waitForEvent('popup');
        await currentPage.getByRole('link', { name: linkText }).click();
        const popup = await popupPromise;

        await popup.waitForLoadState('domcontentloaded');
        popupContext.push(popup);
    }
);

// Close current popup and go back
When(
    'I close the current popup window',
    async ({ popupContext }) => {
        const closed = popupContext.pop();
        await closed.close();
        await popupContext.current().bringToFront();
    }
);

// Switch back without closing
When(
    'I switch back to the previous window',
    async ({ popupContext }) => {
        popupContext.pop();
        await popupContext.current().bringToFront();
    }
);
```

#### `steps/portal.steps.ts` — Working inside popups (separate file!)

```typescript
import { expect } from '@playwright/test';
import { When, Then } from './fixtures';

// These steps use popupContext.current() — works in ANY window
Then(
    'I should see {string} in the page heading',
    async ({ popupContext }, expectedText: string) => {
        const heading = popupContext.current().locator('h1');
        await expect(heading).toContainText(expectedText);
    }
);

When(
    'I fill in {string} with {string}',
    async ({ popupContext }, label: string, value: string) => {
        await popupContext.current().getByLabel(label).fill(value);
    }
);

When(
    'I click the {string} button',
    async ({ popupContext }, buttonText: string) => {
        await popupContext.current()
            .getByRole('button', { name: buttonText }).click();
    }
);
```

#### `steps/api.steps.ts` — Extract data / API calls from popup (another file!)

```typescript
import { expect } from '@playwright/test';
import { Then } from './fixtures';

Then(
    'I extract the reference number from the popup',
    async ({ popupContext }) => {
        const refNumber = await popupContext.current()
            .locator('#refNumber').textContent();
        console.log('Extracted reference:', refNumber);
        expect(refNumber).toBeTruthy();
    }
);

Then(
    'I send the API request from the popup context',
    async ({ popupContext }) => {
        const response = await popupContext.current().request.post('/api/submit', {
            data: { action: 'confirm' },
        });
        expect(response.ok()).toBeTruthy();
    }
);
```

### Step 3: Feature File

```gherkin
Feature: Multi-popup workflow in legacy .NET app

  Scenario: Navigate through nested popups and return
    Given I am on the home page

    # Opens first popup (native waitForEvent under the hood)
    When I click the "Open Portal" link that opens a new window
    Then I should see "Portal Dashboard" in the page heading

    # Inside first popup → opens second popup
    When I click the "New Record" link in the popup that opens another window
    Then I should see "Create Record" in the page heading

    # Work in the second popup
    When I fill in "Name" with "John Doe"
    And I click the "Submit" button
    And I extract the reference number from the popup

    # Close second popup → back to first
    When I close the current popup window
    Then I should see "Portal Dashboard" in the page heading

    # Close first popup → back to original
    When I close the current popup window
    Then I should see the page heading
```

---

## Identifying Popups When All Have the Same URI

For legacy .NET apps where every popup is `Default.aspx` or similar:

| Method | How | Reliability |
|---|---|---|
| **Capture at open time** | `waitForEvent('popup')` + store reference | ✅ **Best — always works** |
| **By query params** | `expect(url).toContain('mode=edit')` | ✅ Good if params differ |
| **By page title** | `await popup.title()` | ⚠️ Only if `<title>` is unique |
| **By unique element** | Check for a specific form/heading | ⚠️ Content must differ |
| **By array index** | `context.pages()[n]` | ❌ Fragile, last resort |

**Capture at open time is the answer for same-URI apps.** Since `waitForEvent('popup')` gives you the exact `Page` object the moment it opens, you never need to identify it — you already have it.

---

## .NET-Specific Tips

### Popups That Auto-Close After Submit

Some .NET popups call `window.close()` after form submission:

```typescript
When('I submit and the popup closes itself', async ({ popupContext }) => {
    const popup = popupContext.current();

    const closePromise = popup.waitForEvent('close');
    await popup.click('#submitBtn');
    await closePromise;

    popupContext.pop();  // remove from stack since it's gone
    await popupContext.current().bringToFront();
});
```

### `showModalDialog` Polyfill (IE-era .NET apps)

Playwright doesn't support `showModalDialog`. Inject a polyfill:

```typescript
await page.addInitScript(() => {
    (window as any).showModalDialog = function(url: string) {
        window.open(url, '_blank', 'width=800,height=600');
    };
});
```

### Popups Opened by Query Parameters

```typescript
Then('I should be on the edit popup', async ({ popupContext }) => {
    const url = popupContext.current().url();
    expect(url).toContain('mode=edit');
});
```

---

## Visual Flow

```
   ┌─ navigation.steps.ts
   │    uses: popupContext.push()
   │
   ├─ portal.steps.ts              ─── all import from ───►  fixtures.ts
   │    uses: popupContext.current()                          (defines popupContext)
   │
   └─ api.steps.ts
        uses: popupContext.current()


   Page Stack During Execution:
   ─────────────────────────────
   Start:    [originalPage]                    depth = 1
   After A:  [originalPage, popup1]            depth = 2
   After B:  [originalPage, popup1, popup2]    depth = 3
   Close:    [originalPage, popup1]            depth = 2
   Close:    [originalPage]                    depth = 1
```

---

## Quick Reference

| What You Want | Code |
|---|---|
| Capture popup (native) | `const p = page.waitForEvent('popup')` → click → `await p` |
| Capture any new page (native) | `const p = context.waitForEvent('page')` → click → `await p` |
| Store for later steps | `popupContext.push(popup)` |
| Access current window | `popupContext.current()` |
| Go back one level | `popupContext.pop()` + optionally `.close()` |
| Go back to original | Loop `pop()`/`close()` until `depth() === 1` |
| Handle self-closing popup | Listen for `'close'` event, then `pop()` |
| List all open pages (native) | `page.context().pages()` |

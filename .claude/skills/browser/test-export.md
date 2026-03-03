# Test Export Guide

Generate standalone Playwright test files from interactive browser exploration. These tests run with `npx playwright test` at zero token cost — the agent is the test author, not the test runner.

## Existing test setup in this project

!`ls playwright.config.{ts,js} 2>/dev/null && echo "--- config preview ---" && head -30 playwright.config.* 2>/dev/null || echo "No playwright config found — will need to create one"`

!`find . -maxdepth 3 -name '*.spec.ts' -o -name '*.spec.js' -o -name '*.e2e.ts' 2>/dev/null | head -10 || echo "No existing test files found"`

## Workflow

### Step 1: Explore the flow interactively

Walk through the user flow using playwright-cli. Take snapshots at each step to understand the page structure:

```bash
playwright-cli open <url>
playwright-cli snapshot
playwright-cli fill e4 "user@example.com"
playwright-cli fill e7 "password123"
playwright-cli click e9
playwright-cli snapshot
playwright-cli screenshot --filename=after-login.png
playwright-cli close
```

### Step 2: Generate a .spec.ts

After a successful flow, write a self-contained test file. Match the project's existing test conventions if tests were detected above. Otherwise use this structure:

```typescript
import { test, expect } from '@playwright/test';

test('user can log in and reach dashboard', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('user@example.com');
  await page.getByLabel('Password').fill('password123');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/.*dashboard/);
  await expect(page.getByText('Welcome')).toBeVisible();
});
```

### Step 3: Verify the test runs

```bash
npx playwright test <test-file> --reporter=line
```

## Rules for exported tests

- **Use Playwright locators** (`getByRole`, `getByText`, `getByLabel`, `getByPlaceholder`) — NOT the `e15` element refs from playwright-cli. Refs are session-specific and break when the DOM changes.
- **Always include `expect` assertions** — a test without assertions proves nothing. Every test should verify at least one observable outcome.
- **Use relative paths** for `page.goto('/path')` so `baseURL` from playwright config applies. Never hardcode `http://localhost:5173` in tests.
- **Each test is independent** — no shared state between tests. Each test starts from a clean page.
- **Place tests** in the project's existing test directory. If none exists, use `tests/` or `e2e/`.
- **Name files descriptively** — `login-flow.spec.ts`, not `test1.spec.ts`.
- **Match existing conventions** — if the project already has tests, match their patterns for locators, assertions, file structure, and naming.

## Scaffold a playwright config

If no playwright config exists in the project:

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  use: {
    baseURL: 'http://localhost:5173',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm run dev',
    port: 5173,
    reuseExistingServer: true,
  },
});
```

The `webServer` block makes tests auto-start the dev server if it's not already running — useful for CI.

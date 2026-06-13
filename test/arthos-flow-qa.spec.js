import { test, expect } from '@playwright/test';

test('ARTH.OS flow navigation and assessment render cleanly', async ({ page }) => {
  test.setTimeout(60000);
  const authPayload = {
    token: 'qa-token',
    user: { id: 'qa-user', name: 'QA User', email: 'qa@example.com' },
  };
  const consoleMessages = [];
  page.on('console', (msg) => {
    if (['error', 'warning'].includes(msg.type())) {
      consoleMessages.push(`${msg.type()}: ${msg.text()}`);
    }
  });
  page.on('pageerror', (error) => {
    consoleMessages.push(`pageerror: ${error.message}`);
  });

  await page.addInitScript(() => {
    window.localStorage.setItem('arth-os-onboarding-complete', 'true');
    window.localStorage.setItem('arth-os-data-consent', 'true');
  });

  await page.route('**/api/auth/login', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(authPayload),
    });
  });
  await page.route('**/api/auth/me', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(authPayload.user),
    });
  });
  await page.route('**/api/subscriptions/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ tier: 'plus', status: 'active' }),
    });
  });
  await page.route('**/api/follow-up/pending**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ followUps: [] }),
    });
  });
  await page.route('**/api/prediction/forecasts**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ forecasts: [] }),
    });
  });
  await page.route('**/api/prediction/scenarios**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ scenarios: [] }),
    });
  });
  await page.route('**/api/prediction/risks**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ risks: [] }),
    });
  });
  await page.route('**/api/prediction/opportunities**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ opportunities: [] }),
    });
  });

  await page.goto('http://127.0.0.1:5173/login', { waitUntil: 'networkidle' });
  await page.locator('#login-email').fill(authPayload.user.email);
  await page.locator('#login-password').fill('password123');
  await page.locator('.auth-submit-btn').click();
  await page.waitForURL('http://127.0.0.1:5173/');
  await expect(page.locator('.app-shell')).toBeVisible();
  await expect(page.locator('.model-screen')).toBeVisible();
  await page.screenshot({ path: 'C:/tmp/arthos-home-desktop.png', fullPage: false });

  await page.locator('.app-nav-tab:has-text("Assess")').click();
  await expect(page.locator('#assessment')).toBeVisible();
  await expect(page.locator('.wizard-progress-track')).toBeVisible();
  await expect(page.locator('.participant-card')).toBeVisible();
  await page.screenshot({ path: 'C:/tmp/arthos-assessment-desktop.png', fullPage: false });

  await page.locator('.app-nav-tab:has-text("Predictions")').click();
  await expect(page.locator('#predictions')).toBeVisible();
  await expect(page.locator('.app-nav-tab.active:has-text("Predictions")')).toBeVisible();

  await page.locator('.app-nav-tab:has-text("Admin")').click();
  await expect(page.locator('#admin')).toBeVisible();
  await expect(page.locator('.app-nav-tab.active:has-text("Admin")')).toBeVisible();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('http://127.0.0.1:5173/#assessment', { waitUntil: 'networkidle' });
  await expect(page.locator('#assessment')).toBeVisible();
  await expect(page.locator('.app-nav-tabs')).toBeVisible();
  await expect(page.locator('.wizard-progress-track')).toBeVisible();
  await page.screenshot({ path: 'C:/tmp/arthos-assessment-mobile.png', fullPage: false });

  const relevantMessages = consoleMessages.filter((message) => {
    return !message.includes('Failed to load resource')
      && !message.includes('favicon')
      && !message.includes('React Router Future Flag Warning');
  });
  expect(relevantMessages).toEqual([]);
});

import { test, expect } from '@playwright/test';

test('ARTH.OS login -> assessment -> big reveal -> plan journey', async ({ page }) => {
  test.setTimeout(90000);
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
    window.localStorage.setItem(
      'arth-os-score-history',
      JSON.stringify([{ date: new Date().toISOString().split('T')[0], score: 80 }])
    );
    window.localStorage.setItem(
      'arth-os-auth',
      JSON.stringify({ user: { id: 'qa-user', name: 'QA User', email: 'qa@example.com' }, token: 'dev-token' })
    );
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

  await page.route('**/api/auth/me', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(authPayload.user),
    });
  });
  await page.route('**/api/saveAssessment', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
    });
  });
  await page.route('**/api/telemetry**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ status: 'ok' }),
    });
  });
  // Mock decision history API to avoid runtime fetch errors
  await page.route('**/api/decision**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ decisions: [] }),
    });
  });

  await page.goto('http://127.0.0.1:5173/login', { waitUntil: 'networkidle' });
  await page.locator('#login-email').fill(authPayload.user.email);
  await page.locator('#login-password').fill('password123');
  await page.locator('.auth-submit-btn').click();
  await page.waitForURL('**/*', { timeout: 20000 });
  // Ensure login succeeded and the app reached the dashboard or onboarding flow
  await expect(page.locator('body')).toContainText('ARTH.OS');
  console.log('consoleMessages after login:', JSON.stringify(consoleMessages.slice(-20))); 
  const storedAuth = await page.evaluate(() => window.localStorage.getItem('arth-os-auth'));
  console.log('localStorage arth-os-auth after login:', storedAuth);
  // Refresh to ensure auth context restores from localStorage before navigating
  await page.reload({ waitUntil: 'networkidle' });



  await page.goto('http://127.0.0.1:5173/big-reveal', { waitUntil: 'networkidle' });
  await expect(page.locator('.big-reveal-title')).toContainText('Financial DNA Reveal');
  await expect(page.locator('.big-reveal-hero')).toBeVisible();
  await page.screenshot({ path: 'C:/tmp/arthos-big-reveal-desktop.png', fullPage: false });

  // Navigate to dashboard via header link, then click the Plan nav item
  await page.locator('header.topbar a.brand').click();
  await page.waitForURL('**/dashboard**', { timeout: 10000 });
  await page.getByRole('link', { name: 'Plan' }).click();
  await page.waitForURL('**/dashboard/plan**', { timeout: 10000 });
  console.log('URL at plan navigation:', await page.url());
  await page.waitForLoadState('networkidle');
  // Force reload if app client-side routing prevented server-side rendering
  await page.reload({ waitUntil: 'networkidle' });
  const planHtml = await page.content();
  console.log('plan HTML length:', planHtml.length);
  console.log('plan snippet:', planHtml.slice(0,2000));
  console.log('consoleMessages before plan assertion:', JSON.stringify(consoleMessages.slice(-20)));
  await page.waitForTimeout(500);
  await expect(page.locator('.dashboard-page .dashboard-page-header h1')).toContainText('Plan & Execution');
  await expect(page.locator('.dashboard-page')).toBeVisible();
  await page.screenshot({ path: 'C:/tmp/arthos-plan-desktop.png', fullPage: false });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('http://127.0.0.1:5173/dashboard/plan', { waitUntil: 'networkidle' });
  await expect(page.locator('h1')).toContainText('Plan & Execution');
  await expect(page.locator('.dashboard-page')).toBeVisible();
  await page.screenshot({ path: 'C:/tmp/arthos-plan-mobile.png', fullPage: false });

  const relevantMessages = consoleMessages.filter((message) => {
    return !message.includes('Failed to load resource')
      && !message.includes('favicon')
      && !message.includes('React Router Future Flag Warning');
  });
  expect(relevantMessages).toEqual([]);
});

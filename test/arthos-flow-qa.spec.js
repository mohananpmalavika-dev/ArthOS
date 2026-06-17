import { test, expect } from '@playwright/test';

const BASE = process.env.DEV_BASE || 'http://localhost:5175';

test('ARTH.OS login -> assessment -> big reveal -> plan journey', async ({ page }) => {
  test.setTimeout(90000);
  const authPayload = {
    token: 'dev-token',
    user: { id: 'qa-user', name: 'QA User', email: 'qa@example.com' },
  };
  const consoleMessages = [];
  page.on('console', (msg) => {
    consoleMessages.push(`${msg.type()}: ${msg.text()}`);
  });
  page.on('pageerror', (error) => {
    consoleMessages.push(`pageerror: ${error.message}`);
  });
  page.on('response', (response) => {
    if (response.status() >= 400) {
      consoleMessages.push(`response ${response.status()}: ${response.url()}`);
    }
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

  await page.route('**/api/memory/sync/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
    });
  });

  await page.route('**/api/features**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ flags: {}, variants: {} }),
    });
  });

  await page.route('**/api/analytics/events', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
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
  await page.route('**/api/user/savePreference**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: {} }),
    });
  });
  await page.route('**/api/user/saveTelemetry', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
    });
  });
  await page.route('**/api/user/saveDecision', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
    });
  });
  await page.route('**/api/user/saveDraft', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
    });
  });
  await page.route('**/api/user/loadDraft**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ draft: null }),
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
  // Mock AI coach endpoints to avoid runtime fetch errors
  await page.route('**/api/coach/**', async (route) => {
    const url = route.request().url();
    if (url.includes('/api/coach/memory')) {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, memory: null }) });
      return;
    }
    if (url.includes('/api/coach/analytics')) {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, analytics: {} }) });
      return;
    }
    if (url.includes('/api/coach/sessions')) {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, sessionId: 'qa-session', coachGreeting: 'Hello QA' }) });
      return;
    }

    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
  });

  await page.route('**/api/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
    });
  });

  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
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



  await page.goto(`${BASE}/big-reveal`, { waitUntil: 'networkidle' });
  await expect(page.locator('.big-reveal-title')).toContainText('Financial DNA Reveal');
  await expect(page.locator('.big-reveal-hero')).toBeVisible();
  await page.screenshot({ path: 'C:/tmp/arthos-big-reveal-desktop.png', fullPage: false });

  // Navigate to dashboard (direct) then click the Plan nav item
  await page.goto(`${BASE}/dashboard`, { waitUntil: 'networkidle' });
  console.log('dashboard url after goto:', await page.url());
  const dashboardHtml = await page.content();
  console.log('dashboard html snippet:', dashboardHtml.slice(0, 1000).replace(/\n/g, ' '));
  await page.locator('.dashboard-page-header h1').waitFor({ state: 'visible', timeout: 20000 });
  await page.getByRole('link', { name: 'Plan' }).click({ force: true });
  await page.waitForURL('**/dashboard/plan', { timeout: 20000 });
  console.log('URL at plan navigation:', await page.url());
  await page.locator('.dashboard-page-header h1').waitFor({ state: 'visible', timeout: 20000 });
  await expect(page.locator('.dashboard-page-header h1')).toContainText('Plan & Execution');
  await page.waitForLoadState('networkidle');
  const planHtml = await page.content();
  console.log('plan HTML length:', planHtml.length);
  console.log('plan snippet:', planHtml.slice(0,2000));
  console.log('consoleMessages before plan assertion:', JSON.stringify(consoleMessages.slice(-20)));
  const hasDashboardPage = await page.evaluate(() => !!document.querySelector('.dashboard-page'));
  console.log('has dashboard-page?', hasDashboardPage);
  const bodyHtml = await page.evaluate(() => document.body.innerHTML);
  console.log('body html length', bodyHtml.length);
  console.log('body snippet', bodyHtml.slice(0,2000));
  await page.locator('.dashboard-page .dashboard-page-header h1').waitFor({ state: 'visible', timeout: 15000 });
  await expect(page.locator('.dashboard-page .dashboard-page-header h1')).toContainText('Plan & Execution');
  await expect(page.locator('.dashboard-page')).toBeVisible();
  await page.screenshot({ path: 'C:/tmp/arthos-plan-desktop.png', fullPage: false });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'C:/tmp/arthos-plan-mobile.png', fullPage: false });

  const relevantMessages = consoleMessages.filter((message) => {
    return !message.includes('Failed to load resource')
      && !message.includes('favicon')
      && !message.includes('React Router Future Flag Warning');
  });
  expect(relevantMessages).toEqual([]);
});

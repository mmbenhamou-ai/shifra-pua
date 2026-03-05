import { test, expect } from '@playwright/test';

/**
 * Requires test users to exist (profiles.role + is_approved = true):
 * test-admin@shifra-pua.dev, test-yoledet@..., test-cook@..., test-deliverer@...
 * Password: testpassword123
 * Create via seed or Supabase Auth + profiles.
 */
test.describe('auth roles redirect', () => {
  test('role=admin redirects to /admin', async ({ page }) => {
    await page.goto('/test-login?role=admin');
    await page.getByTestId('test-login-submit').click();
    await expect(page).toHaveURL(/\/admin/, { timeout: 10000 });
  });

  test('role=yoledet redirects to /yoledet', async ({ page }) => {
    await page.goto('/test-login?role=yoledet');
    await page.getByTestId('test-login-submit').click();
    await expect(page).toHaveURL(/\/yoledet/, { timeout: 10000 });
  });

  test('role=cook redirects to /volunteer', async ({ page }) => {
    await page.goto('/test-login?role=cook');
    await page.getByTestId('test-login-submit').click();
    await expect(page).toHaveURL(/\/volunteer/, { timeout: 10000 });
  });

  test('role=deliverer redirects to /volunteer', async ({ page }) => {
    await page.goto('/test-login?role=deliverer');
    await page.getByTestId('test-login-submit').click();
    await expect(page).toHaveURL(/\/volunteer/, { timeout: 10000 });
  });
});

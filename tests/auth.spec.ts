import { test, expect } from '@playwright/test';

/**
 * E2E test for the admin login flow.
 */
test('admin login flow redirects to dashboard', async ({ page }) => {
  // Navigate to the login page
  await page.goto('/admin/login');

  // Wait for the login form to be visible
  await expect(page.locator('form')).toBeVisible();

  // Enter credentials
  // Regex to handle " *" suffix in labels like "Email *"
  await page.getByLabel(/email/i).fill(process.env.TEST_ADMIN_EMAIL || 'indexlove0815@icloud.com');
  await page.getByLabel(/password/i).fill(process.env.TEST_ADMIN_PASSWORD || '');
  
  // Submit the form
  await page.getByRole('button', { name: /login/i }).click();

  // Assert redirection to the dashboard
  // Use waitForURL to ensure the redirect happens before assertions
  await page.waitForURL(/\/admin(?!\/login)/, { timeout: 10000 });
  await expect(page).toHaveURL(/\/admin(?!\/login)/);
  
  // Verify that the dashboard is loaded (look for navigation)
  await expect(page.locator('nav')).toBeVisible();
});

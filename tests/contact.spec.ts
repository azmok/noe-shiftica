import { test, expect } from '@playwright/test';

/**
 * E2E test for the contact form submission.
 * The contact form is located in the ContactSection of the home page.
 */
test('contact form submission flow', async ({ page }) => {
  // Navigate to the home page where the contact form is located
  await page.goto('/');

  // Ensure the contact form is visible
  // It has id="contact-form"
  const form = page.locator('#contact-form');
  await expect(form).toBeVisible();

  // Fill in the required fields
  await form.locator('#name').fill('Test User');
  await form.locator('#email').fill('test@example.com');
  await form.locator('#message').fill('This is a test message from Playwright.');

  // Select a budget (optional in UI but good for testing)
  // Use selectOption for <select> elements
  await form.locator('#budget').selectOption('15');

  // Submit the form
  // We can use the button's text or getByRole
  await form.getByRole('button', { name: /送信する/i }).click();

  // Assert redirection to the success page
  // The router.push('/contact/success') should trigger after the fetch succeeds.
  await expect(page).toHaveURL(/\/contact\/success/);

  // Verify the success message
  await expect(page.getByRole('heading', { name: '送信完了' })).toBeVisible();
  
  // Optionally, we could check for the "トップページに戻る" button
  await expect(page.getByRole('link', { name: 'トップページに戻る' })).toBeVisible();
});

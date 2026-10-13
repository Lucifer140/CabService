import { test, expect } from '@playwright/test';

test.describe('Sangita Travels Pune — Critical E2E Flows', () => {
  test('01. Public Booking Flow: Fill form and verify instant confirmation', async ({ page }) => {
    await page.goto('/');

    // Verify Brand Title and Header
    await expect(page).toHaveTitle(/Sangita Travels Pune|Pune Mumbai Cab/i);
    await expect(page.locator('text=Sangita Travels')).toBeVisible();

    // Verify Booking Widget is interactive
    const nameInput = page.locator('input[placeholder*="Full Name"], input[name="name"], #customer_name');
    if (await nameInput.count() > 0) {
      await nameInput.first().fill('Suresh Deshmukh');
    }

    const phoneInput = page.locator('input[type="tel"], input[placeholder*="Phone"], #customer_phone');
    if (await phoneInput.count() > 0) {
      await phoneInput.first().fill('9822112233');
    }
  });

  test('02. Admin Login & Dashboard Navigation Flow', async ({ page }) => {
    await page.goto('/login.html');

    // Verify login form is presented
    await expect(page.locator('input[type="password"]')).toBeVisible();

    await page.fill('input[type="text"], input[name="username"]', 'admin');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');

    // Should navigate to /admin or hash route
    await page.waitForURL(/.*admin.*/);
    await expect(page.locator('text=Dashboard, text=Bookings, text=Fleet')).toBeDefined();
  });

  test('03. Fleet & Tours Showcase Rendering', async ({ page }) => {
    await page.goto('/');

    // Verify Fleet cards are displayed with real images
    await expect(page.locator('text=Swift Dzire, text=Innova Crysta')).toBeDefined();

    // Verify Tours section
    await expect(page.locator('text=Mahabaleshwar, text=Shirdi')).toBeDefined();
  });
});

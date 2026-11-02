import { test, expect } from '@playwright/test';
import { gotoLogin, login } from './helpers';

test.describe('Login', () => {
  test('LG-17 เข้า /dashboard ก่อน login ต้อง redirect ไป login', async ({ page }) => {
    await gotoLogin(page);
    await page.goto('/dashboard', { waitUntil: 'commit' });
    await expect(page).toHaveURL(/\/login/);
  });
});

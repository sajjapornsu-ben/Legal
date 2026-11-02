import { test, expect } from '@playwright/test';
import { gotoLogin, USER, PASS, login } from './helpers';

test.describe('Login', () => {
  test('LG-03 Refresh แล้วยังอยู่ในระบบ', async ({ page }) => {
    await gotoLogin(page);
    await login(page, USER, PASS);
    await expect(page).toHaveURL(/\/dashboard/);
    await page.reload();
    await expect(page).toHaveURL(/\/dashboard/);
  });
});

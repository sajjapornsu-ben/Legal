import { test, expect } from '@playwright/test';
import { gotoLogin, identifier, login } from './helpers';

test.describe('Login', () => {
  test('LG-30 ข้อความยาวมาก ไม่ทำให้ระบบ crash', async ({ page }) => {
    await gotoLogin(page);
    await login(page, 'a'.repeat(1000), 'b'.repeat(1000));
    await expect(page).toHaveURL(/\/login/);
    await expect(identifier(page)).toBeVisible();
  });
});

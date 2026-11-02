import { test, expect } from '@playwright/test';
import { gotoLogin, ERROR_TEXT, password, login } from './helpers';

test.describe('Login', () => {
  test('LG-06 Username ไม่มีในระบบ แสดง error เดียวกัน', async ({ page }) => {
    await gotoLogin(page);
    await login(page, 'no.such.user', 'wrong-password-1');
    await expect(page.getByText(ERROR_TEXT)).toBeVisible();
  });
});

import { test, expect } from '@playwright/test';
import { gotoLogin, USER, ERROR_TEXT, password, login } from './helpers';

test.describe('Login', () => {
  test('LG-05 รหัสผ่านผิด แสดง error', async ({ page }) => {
    await gotoLogin(page);
    await login(page, USER, 'wrong-password-1');
    await expect(page.getByText(ERROR_TEXT)).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });
});

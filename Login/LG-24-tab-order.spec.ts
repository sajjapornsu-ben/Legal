import { test, expect } from '@playwright/test';
import { gotoLogin, identifier, password, submit } from './helpers';

test.describe('Login', () => {
  test('LG-24 Tab order: Username → Password → ปุ่มเข้าสู่ระบบ', async ({ page }) => {
    await gotoLogin(page);
    await identifier(page).focus();
    await page.keyboard.press('Tab');
    await expect(password(page)).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(submit(page)).toBeFocused();
  });
});

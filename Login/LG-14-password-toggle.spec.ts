import { test, expect } from '@playwright/test';
import { gotoLogin, password } from './helpers';

test.describe('Login', () => {
  test('LG-14 ปุ่มแสดง/ซ่อนรหัสผ่าน สลับ type ได้', async ({ page }) => {
    await gotoLogin(page);
    await password(page).fill('secret123');
    const toggle = password(page).locator('xpath=..').locator('button');
    await toggle.click();
    await expect(password(page)).toHaveAttribute('type', 'text');
    await toggle.click();
    await expect(password(page)).toHaveAttribute('type', 'password');
  });
});

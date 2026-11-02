import { test, expect } from '@playwright/test';
import { gotoLogin, USER, PASS, login } from './helpers';

test.describe('Login', () => {
  test('LG-04 Logout แล้วกลับหน้า login และเข้า dashboard ไม่ได้', async ({ page }) => {
    await gotoLogin(page);
    await login(page, USER, PASS);
    await expect(page).toHaveURL(/\/dashboard/);
    await page.getByRole('link', { name: 'ออกจากระบบ' }).click();
    // ระบบ redirect ไปหน้า login ของ Intranet (SSO) หลัง logout
    await expect(page).toHaveURL(/\/login/);
    await expect(page).not.toHaveURL(/uat-legal\.planbmedia\.co\.th\/dashboard/);
    await page.goBack();
    await page.goto('/dashboard', { waitUntil: 'commit' });
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator('#login-identifier')).toBeVisible();
  });
});

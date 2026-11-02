import { test, expect } from '@playwright/test';
import { gotoLogin, submit } from './helpers';

test.describe('Login', () => {
  test('LG-22 แสดงองค์ประกอบหน้า login ครบ', async ({ page }) => {
    await gotoLogin(page);
    await expect(page.getByText('LEGAL SYSTEM').first()).toBeVisible();
    await expect(page.getByLabel('อีเมล หรือชื่อผู้ใช้')).toBeVisible();
    await expect(page.getByLabel('รหัสผ่าน')).toBeVisible();
    await expect(submit(page)).toHaveText(/เข้าสู่ระบบ/);
  });
});

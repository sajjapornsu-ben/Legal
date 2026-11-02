import { test, expect } from '@playwright/test';
import { gotoLogin, ERROR_TEXT, login } from './helpers';

test.describe('Login', () => {
  test('LG-31 อักขระพิเศษ/ภาษาไทย/emoji ไม่ login และไม่ crash', async ({ page }) => {
    await gotoLogin(page);
    await login(page, 'ทดสอบ😀', 'ลับ😀!@#$%^&*()');
    await expect(page.getByText(ERROR_TEXT)).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });
});

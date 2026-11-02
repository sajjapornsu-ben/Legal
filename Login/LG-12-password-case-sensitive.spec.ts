import { test, expect } from '@playwright/test';
import { gotoLogin, USER, PASS, ERROR_TEXT, login } from './helpers';

test.describe('Login', () => {
  test('LG-12 Password ตัวพิมพ์ต่างจากเดิม ต้อง login ไม่ได้', async ({ page }) => {
    await gotoLogin(page);
    const altered = PASS.toUpperCase() !== PASS ? PASS.toUpperCase() : PASS.toLowerCase() + 'X';
    await login(page, USER, altered);
    await expect(page.getByText(ERROR_TEXT)).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });
});

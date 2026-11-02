import { test, expect } from '@playwright/test';
import { gotoLogin, USER, PASS, login } from './helpers';

test.describe('Login', () => {
  test('LG-01 Login สำเร็จ', async ({ page }) => {
    await gotoLogin(page);
    await login(page, USER, PASS);
    await expect(page).toHaveURL(/\/dashboard/);
  });
});

import { test, expect } from '@playwright/test';
import { gotoLogin, ERROR_TEXT, login } from './helpers';

test.describe('Login', () => {
  test('LG-15 SQL injection ไม่ login', async ({ page }) => {
    await gotoLogin(page);
    await login(page, "' OR 1=1 --", "' OR 1=1 --");
    await expect(page.getByText(ERROR_TEXT)).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });
});

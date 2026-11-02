import { test, expect } from '@playwright/test';
import { gotoLogin, USER, PASS, identifier, password } from './helpers';

test.describe('Login', () => {
  test('LG-02 Login ด้วยปุ่ม Enter', async ({ page }) => {
    await gotoLogin(page);
    await identifier(page).fill(USER);
    await password(page).fill(PASS);
    await password(page).press('Enter');
    await expect(page).toHaveURL(/\/dashboard/);
  });
});

import { test, expect } from '@playwright/test';
import { gotoLogin, password } from './helpers';

test.describe('Login', () => {
  test('LG-13 ช่อง password ถูก mask', async ({ page }) => {
    await gotoLogin(page);
    await expect(password(page)).toHaveAttribute('type', 'password');
  });
});

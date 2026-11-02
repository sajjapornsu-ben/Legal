import { test, expect } from '@playwright/test';
import { gotoLogin, USER, identifier, password, submit, valueMissing, login } from './helpers';

test.describe('Login', () => {
  test('LG-09 เว้นว่าง Password', async ({ page }) => {
    await gotoLogin(page);
    await identifier(page).fill(USER);
    await submit(page).click();
    await expect(page).toHaveURL(/\/login/);
    expect(await valueMissing(password(page))).toBe(true);
  });
});

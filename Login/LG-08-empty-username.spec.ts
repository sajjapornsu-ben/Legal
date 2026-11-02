import { test, expect } from '@playwright/test';
import { gotoLogin, identifier, password, submit, valueMissing, login } from './helpers';

test.describe('Login', () => {
  test('LG-08 เว้นว่าง Username', async ({ page }) => {
    await gotoLogin(page);
    await password(page).fill('somepassword');
    await submit(page).click();
    await expect(page).toHaveURL(/\/login/);
    expect(await valueMissing(identifier(page))).toBe(true);
  });
});

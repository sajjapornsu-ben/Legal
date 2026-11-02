import { test, expect } from '@playwright/test';
import { gotoLogin, identifier, submit, valueMissing, login } from './helpers';

test.describe('Login', () => {
  test('LG-07 เว้นว่างทั้งสองช่อง ไม่ส่งฟอร์ม', async ({ page }) => {
    await gotoLogin(page);
    await submit(page).click();
    await expect(page).toHaveURL(/\/login/);
    expect(await valueMissing(identifier(page))).toBe(true);
  });
});

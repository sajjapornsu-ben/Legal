import { test, expect } from '@playwright/test';
import { gotoLogin, ERROR_TEXT, login } from './helpers';

test.describe('Login', () => {
  test('LG-16 XSS ไม่ถูก execute', async ({ page }) => {
    await gotoLogin(page);
    let dialogSeen = false;
    page.on('dialog', d => {
      dialogSeen = true;
      d.dismiss();
    });
    await login(page, '<script>alert(1)</script>', '<img src=x onerror=alert(1)>');
    await expect(page.getByText(ERROR_TEXT)).toBeVisible();
    expect(dialogSeen).toBe(false);
  });
});

import { test, expect } from '@playwright/test';
import { gotoLogin, USER, PASS, login } from './helpers';

const SESSION_COOKIE = 'legal-system-session';

test.describe('Login', () => {
  test('LG-21 Session cookie เป็น HttpOnly และถูกเปลี่ยนค่าหลัง logout', async ({ page, context }) => {
    await gotoLogin(page);
    await login(page, USER, PASS);
    await expect(page).toHaveURL(/\/dashboard/);

    const cookie = (await context.cookies()).find(c => c.name === SESSION_COOKIE);
    expect(cookie?.httpOnly).toBe(true);
    expect(cookie?.secure).toBe(true);

    await page.getByRole('link', { name: 'ออกจากระบบ' }).click();
    await expect(page).toHaveURL(/\/login/);
    // cookie ยังมีอยู่หลัง logout แต่ค่าต้องถูก rotate (session เดิมใช้ไม่ได้ ดู LG-04)
    const after = (await context.cookies()).find(c => c.name === SESSION_COOKIE);
    expect(after?.value).not.toBe(cookie?.value);
  });
});

import { test, expect, Page } from '@playwright/test';

const USER = process.env.TEST_USERNAME!;
const PASS = process.env.TEST_PASSWORD!;
const ERROR_TEXT = 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง';
const SESSION_COOKIE = 'legal-system-session';

const usernameField = (page: Page) => page.getByLabel('อีเมล หรือชื่อผู้ใช้');
const passwordField = (page: Page) => page.getByLabel('รหัสผ่าน');
const loginButton = (page: Page) => page.getByRole('button', { name: 'เข้าสู่ระบบ', exact: true });
const logoutLink = (page: Page) => page.getByRole('link', { name: 'ออกจากระบบ' });
const valueMissing = (field: ReturnType<typeof usernameField>) =>
  field.evaluate((e: HTMLInputElement) => e.validity.valueMissing);

const openLoginPage = (page: Page) =>
  test.step('เปิดหน้าเข้าสู่ระบบ', async () => {
    await page.goto('/login');
    await expect(usernameField(page)).toBeVisible();
  });

const fillCredentials = (page: Page, user: string, pass: string) =>
  test.step('กรอกชื่อผู้ใช้และรหัสผ่าน', async () => {
    await usernameField(page).fill(user);
    await passwordField(page).fill(pass);
  });

const clickLogin = (page: Page) =>
  test.step('กดปุ่มเข้าสู่ระบบ', async () => {
    await loginButton(page).click();
  });

const expectErrorAndStayOnLogin = (page: Page) =>
  test.step('ตรวจว่าแสดงข้อความผิดพลาดและยังอยู่หน้าเข้าสู่ระบบ', async () => {
    await expect(page.getByText(ERROR_TEXT)).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

const expectDashboard = (page: Page) =>
  test.step('ตรวจว่าเข้าสู่หน้า Dashboard', async () => {
    await expect(page).toHaveURL(/\/dashboard/);
  });

test.describe('Login', () => {
  test('LG-01 Login สำเร็จ', {
    tag: '@high',
    annotation: [
      { type: 'precondition', description: 'มีบัญชีทดสอบที่ใช้งานได้' },
      { type: 'expected', description: 'เข้าสู่ระบบสำเร็จและเข้าหน้า Dashboard' },
    ],
  }, async ({ page }) => {
    await openLoginPage(page);
    await fillCredentials(page, USER, PASS);
    await clickLogin(page);
    await expectDashboard(page);
  });

  test('LG-02 Login ด้วยปุ่ม Enter', {
    tag: '@medium',
    annotation: [
      { type: 'precondition', description: 'มีบัญชีทดสอบที่ใช้งานได้' },
      { type: 'expected', description: 'เข้าสู่ระบบสำเร็จเหมือนการกดปุ่ม' },
    ],
  }, async ({ page }) => {
    await openLoginPage(page);
    await fillCredentials(page, USER, PASS);
    await test.step('กดปุ่ม Enter ที่ช่องรหัสผ่าน', async () => {
      await passwordField(page).press('Enter');
    });
    await expectDashboard(page);
  });

  test('LG-03 Refresh แล้วยังอยู่ในระบบ', {
    tag: '@medium',
    annotation: [
      { type: 'precondition', description: 'มีบัญชีทดสอบที่ใช้งานได้' },
      { type: 'expected', description: 'หลังรีเฟรชยังอยู่ในหน้า Dashboard ไม่ถูกเด้งออก' },
    ],
  }, async ({ page }) => {
    await openLoginPage(page);
    await fillCredentials(page, USER, PASS);
    await clickLogin(page);
    await expectDashboard(page);
    await test.step('รีเฟรชหน้าเว็บ', async () => {
      await page.reload();
    });
    await expectDashboard(page);
  });

  test('LG-04 Logout แล้วกลับหน้า login และเข้า dashboard ไม่ได้', {
    tag: '@high',
    annotation: [
      { type: 'precondition', description: 'เข้าสู่ระบบแล้ว' },
      { type: 'expected', description: 'ออกจากระบบแล้ว เข้า /dashboard ต้องถูกพาไปหน้า login' },
    ],
  }, async ({ page }) => {
    await openLoginPage(page);
    await fillCredentials(page, USER, PASS);
    await clickLogin(page);
    await expectDashboard(page);
    await test.step('กดออกจากระบบ', async () => {
      await logoutLink(page).click();
    });
    await test.step('ตรวจว่าออกจากหน้า Dashboard แล้ว (ระบบพาไปหน้า login ของ Intranet)', async () => {
      await expect(page).toHaveURL(/\/login/);
      await expect(page).not.toHaveURL(/uat-legal\.planbmedia\.co\.th\/dashboard/);
    });
    await test.step('ลองเปิด /dashboard อีกครั้ง', async () => {
      await page.goto('/dashboard', { waitUntil: 'commit' });
    });
    await test.step('ตรวจว่าถูกพาไปหน้าเข้าสู่ระบบ', async () => {
      await expect(page).toHaveURL(/\/login/);
      await expect(usernameField(page)).toBeVisible();
    });
  });

  test('LG-05 รหัสผ่านผิด แสดง error', {
    tag: '@high',
    annotation: [
      { type: 'precondition', description: 'ยังไม่ได้ login' },
      { type: 'expected', description: 'แสดงข้อความชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง และไม่เข้าสู่ระบบ' },
    ],
  }, async ({ page }) => {
    await openLoginPage(page);
    await fillCredentials(page, USER, 'wrong-password-1');
    await clickLogin(page);
    await expectErrorAndStayOnLogin(page);
  });

  test('LG-06 Username ไม่มีในระบบ แสดง error เดียวกัน', {
    tag: '@medium',
    annotation: [
      { type: 'precondition', description: 'ยังไม่ได้ login' },
      { type: 'expected', description: 'แสดงข้อความผิดพลาดเดียวกับกรณีรหัสผ่านผิด' },
    ],
  }, async ({ page }) => {
    await openLoginPage(page);
    await fillCredentials(page, 'no.such.user', 'wrong-password-1');
    await clickLogin(page);
    await expectErrorAndStayOnLogin(page);
  });

  test('LG-07 เว้นว่างทั้งสองช่อง ไม่ส่งฟอร์ม', {
    tag: '@high',
    annotation: [
      { type: 'precondition', description: 'ยังไม่ได้ login' },
      { type: 'expected', description: 'ระบบแจ้งให้กรอกข้อมูล และยังอยู่หน้าเข้าสู่ระบบ' },
    ],
  }, async ({ page }) => {
    await openLoginPage(page);
    await clickLogin(page);
    await test.step('ตรวจว่าระบบแจ้งให้กรอกชื่อผู้ใช้และยังอยู่หน้าเข้าสู่ระบบ', async () => {
      await expect(page).toHaveURL(/\/login/);
      expect(await valueMissing(usernameField(page))).toBe(true);
    });
  });

  test('LG-08 เว้นว่าง Username', {
    tag: '@medium',
    annotation: [
      { type: 'precondition', description: 'ยังไม่ได้ login' },
      { type: 'expected', description: 'ระบบแจ้งให้กรอกชื่อผู้ใช้' },
    ],
  }, async ({ page }) => {
    await openLoginPage(page);
    await test.step('กรอกเฉพาะรหัสผ่าน', async () => {
      await passwordField(page).fill('somepassword');
    });
    await clickLogin(page);
    await test.step('ตรวจว่าระบบแจ้งให้กรอกชื่อผู้ใช้', async () => {
      await expect(page).toHaveURL(/\/login/);
      expect(await valueMissing(usernameField(page))).toBe(true);
    });
  });

  test('LG-09 เว้นว่าง Password', {
    tag: '@medium',
    annotation: [
      { type: 'precondition', description: 'ยังไม่ได้ login' },
      { type: 'expected', description: 'ระบบแจ้งให้กรอกรหัสผ่าน' },
    ],
  }, async ({ page }) => {
    await openLoginPage(page);
    await test.step('กรอกเฉพาะชื่อผู้ใช้', async () => {
      await usernameField(page).fill(USER);
    });
    await clickLogin(page);
    await test.step('ตรวจว่าระบบแจ้งให้กรอกรหัสผ่าน', async () => {
      await expect(page).toHaveURL(/\/login/);
      expect(await valueMissing(passwordField(page))).toBe(true);
    });
  });

  test('LG-12 Password ตัวพิมพ์ต่างจากเดิม ต้อง login ไม่ได้', {
    tag: '@medium',
    annotation: [
      { type: 'precondition', description: 'ยังไม่ได้ login' },
      { type: 'expected', description: 'รหัสผ่านต้องแยกตัวพิมพ์เล็ก/ใหญ่ จึงเข้าสู่ระบบไม่ได้' },
    ],
  }, async ({ page }) => {
    const altered = PASS.toUpperCase() !== PASS ? PASS.toUpperCase() : PASS.toLowerCase() + 'X';
    await openLoginPage(page);
    await fillCredentials(page, USER, altered);
    await clickLogin(page);
    await expectErrorAndStayOnLogin(page);
  });

  test('LG-13 ช่อง password ถูก mask', {
    tag: '@high',
    annotation: [
      { type: 'precondition', description: 'ยังไม่ได้ login' },
      { type: 'expected', description: 'รหัสผ่านที่พิมพ์ถูกซ่อนเป็นจุด' },
    ],
  }, async ({ page }) => {
    await openLoginPage(page);
    await test.step('ตรวจว่าช่องรหัสผ่านซ่อนข้อความ', async () => {
      await expect(passwordField(page)).toHaveAttribute('type', 'password');
    });
  });

  test('LG-14 ปุ่มแสดง/ซ่อนรหัสผ่าน สลับ type ได้', {
    tag: '@medium',
    annotation: [
      { type: 'precondition', description: 'ยังไม่ได้ login' },
      { type: 'expected', description: 'กดปุ่มแล้วสลับระหว่างแสดงและซ่อนรหัสผ่านได้' },
    ],
  }, async ({ page }) => {
    const toggle = passwordField(page).locator('xpath=..').getByRole('button');
    await openLoginPage(page);
    await test.step('พิมพ์รหัสผ่านและกดปุ่มแสดงรหัสผ่าน', async () => {
      await passwordField(page).fill('secret123');
      await toggle.click();
    });
    await test.step('ตรวจว่ารหัสผ่านแสดงเป็นข้อความ', async () => {
      await expect(passwordField(page)).toHaveAttribute('type', 'text');
    });
    await test.step('กดปุ่มซ่อนรหัสผ่านอีกครั้ง', async () => {
      await toggle.click();
    });
    await test.step('ตรวจว่ารหัสผ่านถูกซ่อนอีกครั้ง', async () => {
      await expect(passwordField(page)).toHaveAttribute('type', 'password');
    });
  });

  test('LG-15 SQL injection ไม่ login', {
    tag: '@high',
    annotation: [
      { type: 'precondition', description: 'ยังไม่ได้ login' },
      { type: 'expected', description: 'ไม่สามารถเข้าสู่ระบบได้ และไม่มีข้อผิดพลาดจากฐานข้อมูลแสดงออกมา' },
    ],
  }, async ({ page }) => {
    await openLoginPage(page);
    await fillCredentials(page, "' OR 1=1 --", "' OR 1=1 --");
    await clickLogin(page);
    await expectErrorAndStayOnLogin(page);
  });

  test('LG-16 XSS ไม่ถูก execute', {
    tag: '@high',
    annotation: [
      { type: 'precondition', description: 'ยังไม่ได้ login' },
      { type: 'expected', description: 'สคริปต์ที่กรอกไม่ถูกรัน และไม่มีหน้าต่าง alert เด้งขึ้น' },
    ],
  }, async ({ page }) => {
    let dialogSeen = false;
    page.on('dialog', d => {
      dialogSeen = true;
      d.dismiss();
    });
    await openLoginPage(page);
    await fillCredentials(page, '<script>alert(1)</script>', '<img src=x onerror=alert(1)>');
    await clickLogin(page);
    await expectErrorAndStayOnLogin(page);
    await test.step('ตรวจว่าไม่มีหน้าต่าง alert เด้งขึ้น', async () => {
      expect(dialogSeen).toBe(false);
    });
  });

  test('LG-17 เข้า /dashboard ก่อน login ต้อง redirect ไป login', {
    tag: '@high',
    annotation: [
      { type: 'precondition', description: 'ยังไม่ได้ login' },
      { type: 'expected', description: 'ถูกพาไปหน้า login' },
    ],
  }, async ({ page }) => {
    await test.step('เปิด /dashboard โดยตรง', async () => {
      await page.goto('/dashboard', { waitUntil: 'commit' });
    });
    await test.step('ตรวจว่าถูกพาไปหน้า login', async () => {
      await expect(page).toHaveURL(/login/);
    });
  });

  test('LG-21 Session cookie เป็น HttpOnly และถูกเปลี่ยนค่าหลัง logout', {
    tag: '@medium',
    annotation: [
      { type: 'precondition', description: 'มีบัญชีทดสอบที่ใช้งานได้' },
      { type: 'expected', description: 'Cookie ของ session เป็น HttpOnly/Secure และค่าถูกเปลี่ยนหลังออกจากระบบ' },
    ],
  }, async ({ page, context }) => {
    let before: string | undefined;
    await openLoginPage(page);
    await fillCredentials(page, USER, PASS);
    await clickLogin(page);
    await expectDashboard(page);
    await test.step('ตรวจ cookie ของ session หลังเข้าสู่ระบบ', async () => {
      const cookie = (await context.cookies()).find(c => c.name === SESSION_COOKIE);
      expect(cookie?.httpOnly).toBe(true);
      expect(cookie?.secure).toBe(true);
      before = cookie?.value;
    });
    await test.step('กดออกจากระบบ', async () => {
      await logoutLink(page).click();
      await expect(page).toHaveURL(/\/login/);
    });
    await test.step('ตรวจว่าค่า cookie ของ session ถูกเปลี่ยน', async () => {
      const after = (await context.cookies()).find(c => c.name === SESSION_COOKIE);
      expect(after?.value).not.toBe(before);
    });
  });

  test('LG-22 แสดงองค์ประกอบหน้า login ครบ', {
    tag: '@medium',
    annotation: [
      { type: 'precondition', description: 'ยังไม่ได้ login' },
      { type: 'expected', description: 'เห็นชื่อระบบ ช่องชื่อผู้ใช้ ช่องรหัสผ่าน และปุ่มเข้าสู่ระบบ' },
    ],
  }, async ({ page }) => {
    await openLoginPage(page);
    await test.step('ตรวจว่าองค์ประกอบในหน้าแสดงครบ', async () => {
      await expect(page.getByText('LEGAL SYSTEM').first()).toBeVisible();
      await expect(usernameField(page)).toBeVisible();
      await expect(passwordField(page)).toBeVisible();
      await expect(loginButton(page)).toBeVisible();
    });
  });

  test('LG-24 Tab order: Username → Password → ปุ่มเข้าสู่ระบบ', {
    tag: '@low',
    annotation: [
      { type: 'precondition', description: 'ยังไม่ได้ login' },
      { type: 'expected', description: 'กด Tab แล้วโฟกัสเลื่อนตามลำดับ ชื่อผู้ใช้ รหัสผ่าน ปุ่มเข้าสู่ระบบ' },
    ],
  }, async ({ page }) => {
    await openLoginPage(page);
    await test.step('โฟกัสที่ช่องชื่อผู้ใช้แล้วกด Tab', async () => {
      await usernameField(page).focus();
      await page.keyboard.press('Tab');
    });
    await test.step('ตรวจว่าโฟกัสอยู่ที่ช่องรหัสผ่าน', async () => {
      await expect(passwordField(page)).toBeFocused();
    });
    await test.step('กด Tab อีกครั้ง', async () => {
      await page.keyboard.press('Tab');
    });
    await test.step('ตรวจว่าโฟกัสอยู่ที่ปุ่มเข้าสู่ระบบ', async () => {
      await expect(loginButton(page)).toBeFocused();
    });
  });

  test('LG-30 ข้อความยาวมาก ไม่ทำให้ระบบ crash', {
    tag: '@low',
    annotation: [
      { type: 'precondition', description: 'ยังไม่ได้ login' },
      { type: 'expected', description: 'ระบบไม่ล่ม ไม่เข้าสู่ระบบ และยังอยู่หน้าเข้าสู่ระบบ' },
    ],
  }, async ({ page }) => {
    await openLoginPage(page);
    await fillCredentials(page, 'a'.repeat(1000), 'b'.repeat(1000));
    await clickLogin(page);
    await test.step('ตรวจว่ายังอยู่หน้าเข้าสู่ระบบและหน้าเว็บยังใช้งานได้', async () => {
      await expect(page).toHaveURL(/\/login/);
      await expect(usernameField(page)).toBeVisible();
    });
  });

  test('LG-31 อักขระพิเศษ/ภาษาไทย/emoji ไม่ login และไม่ crash', {
    tag: '@low',
    annotation: [
      { type: 'precondition', description: 'ยังไม่ได้ login' },
      { type: 'expected', description: 'แสดงข้อความผิดพลาดตามปกติ ไม่เข้าสู่ระบบ และระบบไม่ล่ม' },
    ],
  }, async ({ page }) => {
    await openLoginPage(page);
    await fillCredentials(page, 'ทดสอบ😀', 'ลับ😀!@#$%^&*()');
    await clickLogin(page);
    await expectErrorAndStayOnLogin(page);
  });
});

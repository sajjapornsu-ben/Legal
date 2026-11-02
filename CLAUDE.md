# กติกาการเขียนเทส Playwright ของโปรเจกต์นี้

เทสทุกตัวจะถูกส่งผลเข้า QA Pulse Dashboard ผ่าน `reporters/sheet-reporter.ts`
ต้องเขียนตามรูปแบบนี้ ไม่อย่างนั้นข้อมูลจะไม่ขึ้น Dashboard

## รูปแบบที่ต้องใช้
- เขียนเป็น TypeScript ไฟล์ `tests/<ชื่อ module>.spec.ts`
- ครอบเทสด้วย `test.describe('<ชื่อ Module>', ...)` เช่น 'Login', 'Booking'
- **ชื่อเทสต้องขึ้นต้นด้วยรหัส Scenario** ตามด้วยช่องว่างและคำอธิบายภาษาไทย
  เช่น `'LG-17 เข้า /dashboard ก่อน login ต้อง redirect ไป login'`
  - ห้ามมีอะไรนำหน้ารหัส และ 1 รหัส = 1 เทส ห้ามซ้ำ
  - ใช้รหัสตามแผนเทส ถ้าแผนไม่มีรหัส ให้ถามก่อน ห้ามตั้งเอง
- ใส่ `tag` priority เป็น `'@high'`, `'@medium'` หรือ `'@low'` อย่างใดอย่างหนึ่ง
- ใส่ `annotation`:
  - `{ type: 'precondition', description: '...' }` (ถ้ามี)
  - `{ type: 'expected', description: '...' }` (ต้องมี)
- แบ่งทุกขั้นตอนด้วย `await test.step('<ขั้นตอนภาษาไทย>', async () => { ... })`
  ชื่อ step ต้องอ่านเข้าใจสำหรับคนที่ไม่ใช่โปรแกรมเมอร์ เพราะจะไปแสดงใน Dashboard

## ตัวอย่าง
```typescript
import { test, expect } from '@playwright/test';

test.describe('Login', () => {
  test('LG-17 เข้า /dashboard ก่อน login ต้อง redirect ไป login', {
    tag: '@high',
    annotation: [
      { type: 'precondition', description: 'ยังไม่ได้ login' },
      { type: 'expected', description: 'ถูกพาไปหน้า login' },
    ],
  }, async ({ page }) => {
    await test.step('เปิด /dashboard โดยตรง', async () => {
      await page.goto('/dashboard');
    });
    await test.step('ตรวจว่าถูกพาไปหน้า login', async () => {
      await expect(page).toHaveURL(/login/);
    });
  });
});
```

## ข้อห้าม
- ห้ามแก้ไฟล์ `reporters/sheet-reporter.ts`, `playwright.config.ts` และ `.github/workflows/`
  ยกเว้นได้รับคำสั่งตรงๆ
- ห้ามเขียนรหัสผ่าน / token ลงในไฟล์เทส ให้อ่านจาก `process.env` เช่น `process.env.TEST_PASSWORD`
- ห้ามเปิด อ่าน หรือแสดงค่าในไฟล์ `.env`
- ใช้ `baseURL` จาก config เช่น `page.goto('/login')` ไม่ใส่ URL เต็ม
- ใช้ locator แบบ `getByRole`, `getByLabel`, `getByText` ก่อน CSS selector

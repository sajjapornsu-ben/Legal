import { expect, Page } from '@playwright/test';

export const USER = process.env.TEST_USERNAME!;
export const PASS = process.env.TEST_PASSWORD!;
export const ERROR_TEXT = 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง';

export const identifier = (page: Page) => page.locator('#login-identifier');
export const password = (page: Page) => page.locator('#login-password');
export const submit = (page: Page) => page.locator('button[type=submit]');
export const valueMissing = (input: ReturnType<typeof identifier>) =>
  input.evaluate((e: HTMLInputElement) => e.validity.valueMissing);

export async function gotoLogin(page: Page) {
  await page.goto('/login');
  await expect(identifier(page)).toBeVisible();
}

export async function login(page: Page, user: string, pass: string) {
  await identifier(page).fill(user);
  await password(page).fill(pass);
  await submit(page).click();
}

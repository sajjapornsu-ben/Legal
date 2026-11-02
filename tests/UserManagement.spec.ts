import { test, expect, Page } from '@playwright/test';
import { randomBytes } from 'crypto';

const USER = process.env.TEST_USERNAME!;
const PASS = process.env.TEST_PASSWORD!;

type NewUser = { username: string; email: string; firstName: string; lastName: string; password: string };

const newUser = (): NewUser => {
  const id = randomBytes(4).toString('hex');
  return {
    username: `qa_um_${id}`,
    email: `qa_um_${id}@example.com`,
    firstName: `QAFirst${id}`,
    lastName: `QALast${id}`,
    password: `Aa1!${randomBytes(4).toString('hex')}`,
  };
};

const fullName = (u: NewUser) => `${u.firstName} ${u.lastName}`;

// ฟอร์มของระบบไม่ได้ผูก label กับ input จึงใช้ placeholder ภายใน modal
const modal = (page: Page, title: string) =>
  page
    .getByText(title, { exact: true })
    .locator('xpath=ancestor::div[.//button[normalize-space()="บันทึก"]][1]');
const addModal = (page: Page) => modal(page, 'เพิ่มผู้ใช้งานใหม่');
const editModal = (page: Page) => modal(page, 'แก้ไขผู้ใช้งาน');

const searchBox = (page: Page) => page.getByPlaceholder(/ค้นหา Username/);
const userRow = (page: Page, text: string) => page.getByRole('row').filter({ hasText: text });
const totalCounter = (page: Page) => page.getByText(/ทั้งหมด \d+ รายการ/);
const okButton = (page: Page) => page.getByRole('button', { name: 'ตกลง' });

// ผู้ใช้ที่สร้างระหว่างเทส เพื่อลบทิ้งหลังจบ
let created: string[] = [];

async function fillAddForm(page: Page, u: NewUser) {
  const m = addModal(page);
  await m.getByPlaceholder('username', { exact: true }).fill(u.username);
  await m.getByPlaceholder('email@company.co.th').fill(u.email);
  await m.getByPlaceholder('ชื่อ', { exact: true }).fill(u.firstName);
  await m.getByPlaceholder('นามสกุล').fill(u.lastName);
  await m.getByRole('combobox').nth(0).selectOption({ label: 'Employee' });
  await m.getByPlaceholder('••••••••').fill(u.password);
}

async function createUser(page: Page, u: NewUser) {
  await page.getByRole('button', { name: /เพิ่มผู้ใช้งาน/ }).click();
  await fillAddForm(page, u);
  await addModal(page).getByRole('button', { name: 'บันทึก', exact: true }).click();
  await expect(page.getByText('เพิ่มผู้ใช้งานสำเร็จ')).toBeVisible();
  created.push(u.username);
  await okButton(page).click();
  await expect(addModal(page)).toHaveCount(0);
}

async function searchUser(page: Page, text: string) {
  await searchBox(page).fill(text);
}

async function deleteUser(page: Page, username: string) {
  await searchUser(page, username);
  await userRow(page, username).getByTitle('ลบ').click();
  await page.getByRole('button', { name: 'ลบผู้ใช้งาน' }).click();
  await expect(page.getByText('ลบผู้ใช้งานสำเร็จ')).toBeVisible();
  await okButton(page).click();
  created = created.filter(x => x !== username);
}

const openLoginAndEnter = (page: Page) =>
  test.step('เข้าสู่ระบบด้วยบัญชีทดสอบ', async () => {
    await page.goto('/login');
    await page.getByPlaceholder(/username/).fill(USER);
    await page.getByPlaceholder('••••••••').fill(PASS);
    await page.getByRole('button', { name: 'เข้าสู่ระบบ', exact: true }).click();
    await expect(page).toHaveURL(url => url.pathname === '/dashboard');
  });

const openUserPage = (page: Page) =>
  test.step('เปิดเมนู ผู้ใช้งาน', async () => {
    await page.goto('/master/user');
    await expect(page.getByText('จัดการผู้ใช้งาน')).toBeVisible();
    await expect(totalCounter(page)).toBeVisible();
  });

const prepareUser = (page: Page, u: NewUser) =>
  test.step('เตรียมข้อมูล: สร้างผู้ใช้ทดสอบ', async () => {
    await createUser(page, u);
  });

test.describe('User Management', () => {
  test.beforeEach(async ({ page }) => {
    created = [];
    await openLoginAndEnter(page);
    await openUserPage(page);
  });

  test.afterEach(async ({ page }) => {
    if (created.length === 0) return;
    await test.step('เก็บกวาดข้อมูล: ลบผู้ใช้ทดสอบที่สร้างไว้', async () => {
      // โหลดหน้าใหม่เพื่อปิด modal/dialog ที่อาจค้างจากเทส
      await page.goto('/master/user');
      for (const username of [...created]) {
        try {
          await deleteUser(page, username);
        } catch {
          // ถ้าลบไม่ได้ ให้เทสถัดไปทำงานต่อ และแจ้งชื่อผู้ใช้ที่ค้างในรายงาน
          test.info().annotations.push({ type: 'cleanup-failed', description: username });
        }
      }
    });
  });

  // ---------- Read: รายการ / ค้นหา ----------

  test('UM-01 เปิดเมนู ผู้ใช้งาน แสดงตารางและคอลัมน์', {
    tag: '@high',
    annotation: [
      { type: 'precondition', description: 'เข้าสู่ระบบด้วยผู้ใช้ที่มีสิทธิ์ดูผู้ใช้งาน' },
      { type: 'expected', description: 'แสดงตารางผู้ใช้งาน พร้อมคอลัมน์ Username, ชื่อ-นามสกุล, แผนก/Group, Notification, วันที่สร้าง, วันที่แก้ไข, สถานะ, จัดการ และตัวนับ ทั้งหมด N รายการ' },
    ],
  }, async ({ page }) => {
    await test.step('ตรวจหัวคอลัมน์ของตาราง', async () => {
      for (const name of ['Username', 'ชื่อ – นามสกุล', 'แผนก / Group', 'Notification', 'วันที่สร้าง', 'วันที่แก้ไข', 'สถานะ', 'จัดการ']) {
        await expect(page.getByRole('columnheader', { name: new RegExp(name) })).toBeVisible();
      }
    });
    await test.step('ตรวจว่ามีตัวนับจำนวนรายการและมีข้อมูลในตาราง', async () => {
      await expect(totalCounter(page)).toBeVisible();
      await expect(userRow(page, USER).first()).toBeVisible();
    });
  });

  test('UM-02 ตัวนับ ทั้งหมด N รายการ ตรงกับข้อความ pagination', {
    tag: '@high',
    annotation: [
      { type: 'precondition', description: 'เข้าสู่ระบบแล้ว และอยู่ในหน้า ผู้ใช้งาน' },
      { type: 'expected', description: 'จำนวน N ที่หัวตารางเท่ากับ N ในข้อความ แสดง x–y จาก N รายการ' },
    ],
  }, async ({ page }) => {
    await test.step('อ่านตัวเลขจากหัวตารางและท้ายตาราง', async () => {
      const header = await totalCounter(page).innerText();
      const footer = await page.getByText(/แสดง \d+–\d+ จาก \d+ รายการ/).innerText();
      expect(header.match(/\d+/)![0]).toBe(footer.match(/จาก (\d+)/)![1]);
    });
  });

  test('UM-05 ค้นหาด้วย Username', {
    tag: '@high',
    annotation: [
      { type: 'precondition', description: 'มีผู้ใช้ในระบบ' },
      { type: 'expected', description: 'ตารางแสดงเฉพาะแถวที่ตรงกับ Username และตัวนับอัปเดต' },
    ],
  }, async ({ page }) => {
    const u = newUser();
    await prepareUser(page, u);
    await test.step('พิมพ์ Username ในช่องค้นหา', async () => {
      await searchUser(page, u.username);
    });
    await test.step('ตรวจว่าเหลือเฉพาะผู้ใช้ที่ค้นหา', async () => {
      await expect(userRow(page, u.username)).toHaveCount(1);
      await expect(totalCounter(page)).toHaveText(/ทั้งหมด 1 รายการ/);
    });
  });

  test('UM-06 ค้นหาด้วยชื่อ', {
    tag: '@high',
    annotation: [
      { type: 'precondition', description: 'มีผู้ใช้ที่มีชื่อเฉพาะตัว' },
      { type: 'expected', description: 'ตารางแสดงเฉพาะแถวที่ตรงกับชื่อ และตัวนับอัปเดต' },
    ],
  }, async ({ page }) => {
    const u = newUser();
    await prepareUser(page, u);
    await test.step('พิมพ์ชื่อในช่องค้นหา', async () => {
      await searchUser(page, u.firstName);
    });
    await test.step('ตรวจว่าเหลือเฉพาะผู้ใช้ที่ค้นหา', async () => {
      await expect(userRow(page, u.username)).toHaveCount(1);
      await expect(totalCounter(page)).toHaveText(/ทั้งหมด 1 รายการ/);
    });
  });

  // ---------- Create ----------

  test('UM-20 เปิด modal เพิ่มผู้ใช้งาน ค่าเริ่มต้นถูกต้อง', {
    tag: '@high',
    annotation: [
      { type: 'precondition', description: 'อยู่ในหน้า ผู้ใช้งาน' },
      { type: 'expected', description: 'เปิด modal เพิ่มผู้ใช้งานใหม่ ฟิลด์ว่าง แผนกหลักเป็น ไม่ระบุ สถานะเป็น ใช้งาน และช่องรหัสผ่านซ่อนข้อความ' },
    ],
  }, async ({ page }) => {
    await test.step('กดปุ่ม เพิ่มผู้ใช้งาน', async () => {
      await page.getByRole('button', { name: /เพิ่มผู้ใช้งาน/ }).click();
    });
    await test.step('ตรวจค่าเริ่มต้นใน modal', async () => {
      const m = addModal(page);
      await expect(m).toBeVisible();
      await expect(m.getByPlaceholder('username', { exact: true })).toHaveValue('');
      await expect(m.getByPlaceholder('email@company.co.th')).toHaveValue('');
      await expect(m.getByRole('combobox').nth(0).locator('option:checked')).toHaveText(/เลือก/);
      await expect(m.getByRole('combobox').nth(1).locator('option:checked')).toHaveText(/ไม่ระบุ/);
      await expect(m.getByRole('radio', { name: 'ใช้งาน', exact: true })).toBeChecked();
      await expect(m.getByPlaceholder('••••••••')).toHaveAttribute('type', 'password');
    });
  });

  test('UM-21 สร้าง Local User ด้วยข้อมูลครบถูกต้อง', {
    tag: '@high',
    annotation: [
      { type: 'precondition', description: 'อยู่ในหน้า ผู้ใช้งาน และ Username/Email ยังไม่มีในระบบ' },
      { type: 'expected', description: 'ระบบแจ้งเพิ่มผู้ใช้งานสำเร็จ modal ปิด และผู้ใช้ใหม่แสดงในตารางสถานะ ใช้งาน' },
    ],
  }, async ({ page }) => {
    const u = newUser();
    await test.step('กดปุ่ม เพิ่มผู้ใช้งาน และกรอกข้อมูลให้ครบ', async () => {
      await page.getByRole('button', { name: /เพิ่มผู้ใช้งาน/ }).click();
      await fillAddForm(page, u);
    });
    await test.step('กดบันทึก', async () => {
      await addModal(page).getByRole('button', { name: 'บันทึก', exact: true }).click();
    });
    await test.step('ตรวจว่าระบบแจ้งเพิ่มผู้ใช้งานสำเร็จ', async () => {
      await expect(page.getByText('เพิ่มผู้ใช้งานสำเร็จ')).toBeVisible();
      created.push(u.username);
      await okButton(page).click();
      await expect(addModal(page)).toHaveCount(0);
    });
    await test.step('ค้นหาผู้ใช้ใหม่และตรวจข้อมูลในตาราง', async () => {
      await searchUser(page, u.username);
      const row = userRow(page, u.username);
      await expect(row).toContainText(fullName(u));
      await expect(row).toContainText(u.email);
      await expect(row.getByRole('cell').last()).toHaveText(/^\s*ใช้งาน\s*$/);
    });
  });

  test('UM-22 เว้นว่างฟิลด์บังคับแล้วบันทึก', {
    tag: '@high',
    annotation: [
      { type: 'precondition', description: 'เปิด modal เพิ่มผู้ใช้งานและยังไม่กรอกข้อมูล' },
      { type: 'expected', description: 'บันทึกไม่ได้ modal ยังเปิดอยู่ และแสดง error ใต้ Username, Email, ชื่อ, นามสกุล, Role' },
    ],
  }, async ({ page }) => {
    await test.step('กดปุ่ม เพิ่มผู้ใช้งาน แล้วกดบันทึกโดยไม่กรอกอะไร', async () => {
      await page.getByRole('button', { name: /เพิ่มผู้ใช้งาน/ }).click();
      await addModal(page).getByRole('button', { name: 'บันทึก', exact: true }).click();
    });
    await test.step('ตรวจว่าแสดงข้อความแจ้งให้กรอกข้อมูลและ modal ยังเปิดอยู่', async () => {
      const m = addModal(page);
      await expect(m).toBeVisible();
      for (const text of ['กรุณากรอก Username', 'กรุณากรอก Email', 'กรุณากรอกชื่อ', 'กรุณากรอกนามสกุล', 'กรุณาเลือก Role']) {
        await expect(m.getByText(text)).toBeVisible();
      }
    });
  });

  test('UM-23 เว้นว่างรหัสผ่านตอนสร้าง Local User', {
    tag: '@high',
    annotation: [
      { type: 'precondition', description: 'เปิด modal เพิ่มผู้ใช้งาน' },
      { type: 'expected', description: 'บันทึกไม่ได้ และแจ้งให้กรอกรหัสผ่าน' },
    ],
  }, async ({ page }) => {
    const u = newUser();
    await test.step('เปิด modal และกรอกข้อมูลทุกช่องยกเว้นรหัสผ่าน', async () => {
      await page.getByRole('button', { name: /เพิ่มผู้ใช้งาน/ }).click();
      await fillAddForm(page, u);
      await addModal(page).getByPlaceholder('••••••••').fill('');
    });
    await test.step('กดบันทึก', async () => {
      await addModal(page).getByRole('button', { name: 'บันทึก', exact: true }).click();
    });
    await test.step('ตรวจว่าแจ้งให้กรอกรหัสผ่านและยังไม่มีผู้ใช้ถูกสร้าง', async () => {
      await expect(addModal(page).getByText('กรุณากรอกรหัสผ่าน')).toBeVisible();
      await expect(page.getByText('เพิ่มผู้ใช้งานสำเร็จ')).toHaveCount(0);
    });
  });

  test('UM-29 Username ซ้ำกับผู้ใช้ที่ยังไม่ถูกลบ', {
    tag: '@high',
    annotation: [
      { type: 'precondition', description: 'มีผู้ใช้ทดสอบอยู่ในระบบ' },
      { type: 'expected', description: 'บันทึกไม่ได้ ระบบแจ้งว่า Username ซ้ำ (ตามระบบ: Username already exists)' },
    ],
  }, async ({ page }) => {
    const u = newUser();
    await prepareUser(page, u);
    await test.step('เปิด modal เพิ่มผู้ใช้ด้วย Username เดิมแต่ Email ใหม่', async () => {
      await page.getByRole('button', { name: /เพิ่มผู้ใช้งาน/ }).click();
      await fillAddForm(page, { ...newUser(), username: u.username });
    });
    await test.step('กดบันทึก', async () => {
      await addModal(page).getByRole('button', { name: 'บันทึก', exact: true }).click();
    });
    await test.step('ตรวจว่าระบบแจ้งว่า Username ซ้ำ', async () => {
      await expect(page.getByText('Username already exists')).toBeVisible();
      await page.getByRole('button', { name: 'ปิด', exact: true }).click();
      await page.getByRole('button', { name: 'ยกเลิก', exact: true }).click();
    });
    await test.step('ตรวจว่ามีผู้ใช้ Username นี้เพียงรายการเดียว', async () => {
      await searchUser(page, u.username);
      await expect(userRow(page, u.username)).toHaveCount(1);
    });
  });

  test('UM-30 Email ซ้ำกับผู้ใช้ที่ยังไม่ถูกลบ', {
    tag: '@high',
    annotation: [
      { type: 'precondition', description: 'มีผู้ใช้ทดสอบอยู่ในระบบ' },
      { type: 'expected', description: 'บันทึกไม่ได้ ระบบแจ้งว่า Email ซ้ำ (ตามระบบ: Email already exists)' },
    ],
  }, async ({ page }) => {
    const u = newUser();
    await prepareUser(page, u);
    await test.step('เปิด modal เพิ่มผู้ใช้ด้วย Email เดิมแต่ Username ใหม่', async () => {
      await page.getByRole('button', { name: /เพิ่มผู้ใช้งาน/ }).click();
      await fillAddForm(page, { ...newUser(), email: u.email });
    });
    await test.step('กดบันทึก', async () => {
      await addModal(page).getByRole('button', { name: 'บันทึก', exact: true }).click();
    });
    await test.step('ตรวจว่าระบบแจ้งว่า Email ซ้ำ', async () => {
      await expect(page.getByText('Email already exists')).toBeVisible();
      await page.getByRole('button', { name: 'ปิด', exact: true }).click();
      await page.getByRole('button', { name: 'ยกเลิก', exact: true }).click();
    });
  });

  test('UM-31 Username/Email ซ้ำกับผู้ใช้ที่ถูกลบแล้ว สร้างใหม่ได้', {
    tag: '@high',
    annotation: [
      { type: 'precondition', description: 'ผู้ใช้ทดสอบถูกสร้างแล้วลบทิ้ง' },
      { type: 'expected', description: 'สร้างผู้ใช้ด้วย Username/Email เดิมได้ตามปกติ' },
    ],
  }, async ({ page }) => {
    const u = newUser();
    await prepareUser(page, u);
    await test.step('ลบผู้ใช้ทดสอบ', async () => {
      await deleteUser(page, u.username);
    });
    await test.step('สร้างผู้ใช้ใหม่ด้วย Username และ Email เดิม', async () => {
      await createUser(page, u);
    });
    await test.step('ตรวจว่าผู้ใช้ใหม่แสดงในตาราง', async () => {
      await searchUser(page, u.username);
      await expect(userRow(page, u.username)).toHaveCount(1);
    });
  });

  // ---------- Update ----------

  test('UM-45 เปิดแก้ไข Local User แสดงข้อมูลเดิม', {
    tag: '@high',
    annotation: [
      { type: 'precondition', description: 'มี Local User ทดสอบในระบบ' },
      { type: 'expected', description: 'modal แก้ไขผู้ใช้งานแสดงข้อมูลเดิมครบ' },
    ],
  }, async ({ page }) => {
    const u = newUser();
    await prepareUser(page, u);
    await test.step('ค้นหาผู้ใช้และกดปุ่มแก้ไข', async () => {
      await searchUser(page, u.username);
      await userRow(page, u.username).getByTitle('แก้ไข').click();
    });
    await test.step('ตรวจว่า modal แสดงข้อมูลเดิม', async () => {
      const m = editModal(page);
      await expect(m).toBeVisible();
      await expect(m.getByPlaceholder('username', { exact: true })).toHaveValue(u.username);
      await expect(m.getByPlaceholder('email@company.co.th')).toHaveValue(u.email);
      await expect(m.getByPlaceholder('ชื่อ', { exact: true })).toHaveValue(u.firstName);
      await expect(m.getByPlaceholder('นามสกุล')).toHaveValue(u.lastName);
    });
  });

  test('UM-46 แก้ไขข้อมูล Local User แล้วบันทึก', {
    tag: '@high',
    annotation: [
      { type: 'precondition', description: 'มี Local User ทดสอบในระบบ' },
      { type: 'expected', description: 'ระบบแจ้งแก้ไขสำเร็จ ตารางแสดงชื่อใหม่ และวันที่แก้ไขเปลี่ยน' },
    ],
  }, async ({ page }) => {
    const u = newUser();
    const newFirstName = `${u.firstName}Edit`;
    let updatedBefore = '';
    await prepareUser(page, u);
    await test.step('ค้นหาผู้ใช้และจดวันที่แก้ไขเดิม', async () => {
      await searchUser(page, u.username);
      updatedBefore = await userRow(page, u.username).getByRole('cell').nth(-2).innerText();
    });
    await test.step('กดปุ่มแก้ไข เปลี่ยนชื่อ แล้วกดบันทึก', async () => {
      await userRow(page, u.username).getByTitle('แก้ไข').click();
      await editModal(page).getByPlaceholder('ชื่อ', { exact: true }).fill(newFirstName);
      await editModal(page).getByRole('button', { name: 'บันทึก', exact: true }).click();
    });
    await test.step('ตรวจว่าระบบแจ้งแก้ไขสำเร็จ', async () => {
      await expect(page.getByText('แก้ไขผู้ใช้งานสำเร็จ')).toBeVisible();
      await okButton(page).click();
      await expect(editModal(page)).toHaveCount(0);
    });
    await test.step('ตรวจว่าตารางแสดงชื่อใหม่และวันที่แก้ไขเปลี่ยน', async () => {
      const row = userRow(page, u.username);
      await expect(row).toContainText(newFirstName);
      await expect(row.getByRole('cell').nth(-2)).not.toHaveText(updatedBefore);
    });
  });

  test('UM-56 ปิดการใช้งานผู้ใช้ที่ใช้งานอยู่', {
    tag: '@high',
    annotation: [
      { type: 'precondition', description: 'มีผู้ใช้ทดสอบสถานะ ใช้งาน' },
      { type: 'expected', description: 'หลังยืนยัน สถานะในตารางเปลี่ยนเป็น ปิดใช้งาน' },
    ],
  }, async ({ page }) => {
    const u = newUser();
    await prepareUser(page, u);
    await test.step('ค้นหาผู้ใช้และกดปุ่มปิดการใช้งาน (power)', async () => {
      await searchUser(page, u.username);
      await userRow(page, u.username).getByTitle('คลิกเพื่อปิดใช้งาน').click();
    });
    await test.step('ยืนยันการปิดใช้งานใน dialog', async () => {
      await expect(page.getByText('ต้องการปิดรายการนี้ใช่หรือไม่?')).toBeVisible();
      await page.getByRole('button', { name: 'ปิดใช้งาน', exact: true }).click();
    });
    await test.step('ตรวจว่าระบบแจ้งสำเร็จและสถานะเปลี่ยนเป็น ปิดใช้งาน', async () => {
      await expect(page.getByText('ปิดใช้งานสำเร็จ')).toBeVisible();
      await okButton(page).click();
      await expect(userRow(page, u.username).getByRole('cell').last()).toHaveText(/^\s*ปิดใช้งาน\s*$/);
    });
  });

  test('UM-57 เปิดการใช้งานผู้ใช้ที่ถูกปิดอยู่', {
    tag: '@high',
    annotation: [
      { type: 'precondition', description: 'มีผู้ใช้ทดสอบสถานะ ปิดใช้งาน' },
      { type: 'expected', description: 'หลังยืนยัน สถานะในตารางกลับเป็น ใช้งาน' },
    ],
  }, async ({ page }) => {
    const u = newUser();
    await prepareUser(page, u);
    await test.step('เตรียมข้อมูล: ปิดการใช้งานผู้ใช้ทดสอบ', async () => {
      await searchUser(page, u.username);
      await userRow(page, u.username).getByTitle('คลิกเพื่อปิดใช้งาน').click();
      await page.getByRole('button', { name: 'ปิดใช้งาน', exact: true }).click();
      await expect(page.getByText('ปิดใช้งานสำเร็จ')).toBeVisible();
      await okButton(page).click();
    });
    await test.step('กดปุ่มเปิดการใช้งาน (power)', async () => {
      await userRow(page, u.username).getByTitle('คลิกเพื่อเปิดใช้งาน').click();
    });
    await test.step('ยืนยันการเปิดใช้งานใน dialog', async () => {
      await expect(page.getByText('ต้องการเปิดรายการนี้ใช่หรือไม่?')).toBeVisible();
      await page.getByRole('button', { name: 'เปิดใช้งาน', exact: true }).click();
    });
    await test.step('ตรวจว่าสถานะกลับเป็น ใช้งาน', async () => {
      await expect(page.getByText('เปิดใช้งานสำเร็จ')).toBeVisible();
      await okButton(page).click();
      await expect(userRow(page, u.username).getByRole('cell').last()).toHaveText(/^\s*ใช้งาน\s*$/);
    });
  });

  // ---------- Delete ----------

  test('UM-61 กดปุ่มลบ แสดง dialog ยืนยันพร้อมชื่อผู้ใช้', {
    tag: '@high',
    annotation: [
      { type: 'precondition', description: 'มีผู้ใช้ทดสอบในระบบ' },
      { type: 'expected', description: 'แสดง dialog ยืนยันการลบ พร้อมชื่อผู้ใช้ที่จะลบ' },
    ],
  }, async ({ page }) => {
    const u = newUser();
    await prepareUser(page, u);
    await test.step('ค้นหาผู้ใช้และกดปุ่มลบ', async () => {
      await searchUser(page, u.username);
      await userRow(page, u.username).getByTitle('ลบ').click();
    });
    await test.step('ตรวจว่า dialog แสดงชื่อผู้ใช้ที่จะลบ', async () => {
      await expect(page.getByText('ยืนยันการลบผู้ใช้งาน')).toBeVisible();
      await expect(page.getByText(`คุณต้องการลบ ${fullName(u)} ออกจากระบบหรือไม่?`)).toBeVisible();
    });
  });

  test('UM-62 กดยกเลิกใน dialog ลบ ข้อมูลไม่เปลี่ยน', {
    tag: '@high',
    annotation: [
      { type: 'precondition', description: 'มีผู้ใช้ทดสอบในระบบ' },
      { type: 'expected', description: 'dialog ปิด และผู้ใช้ยังอยู่ในตาราง' },
    ],
  }, async ({ page }) => {
    const u = newUser();
    await prepareUser(page, u);
    await test.step('ค้นหาผู้ใช้ กดปุ่มลบ แล้วกดยกเลิก', async () => {
      await searchUser(page, u.username);
      await userRow(page, u.username).getByTitle('ลบ').click();
      await page.getByRole('button', { name: 'ยกเลิก', exact: true }).click();
    });
    await test.step('ตรวจว่า dialog ปิดและผู้ใช้ยังอยู่ในตาราง', async () => {
      await expect(page.getByText('ยืนยันการลบผู้ใช้งาน')).toHaveCount(0);
      await expect(userRow(page, u.username)).toHaveCount(1);
    });
  });

  test('UM-63 ยืนยันลบผู้ใช้ ผู้ใช้หายจากตาราง', {
    tag: '@high',
    annotation: [
      { type: 'precondition', description: 'มีผู้ใช้ทดสอบในระบบ' },
      { type: 'expected', description: 'ระบบแจ้งลบสำเร็จ และผู้ใช้หายจากตาราง' },
    ],
  }, async ({ page }) => {
    const u = newUser();
    await prepareUser(page, u);
    await test.step('ค้นหาผู้ใช้ กดปุ่มลบ แล้วยืนยันลบ', async () => {
      await searchUser(page, u.username);
      await userRow(page, u.username).getByTitle('ลบ').click();
      await page.getByRole('button', { name: 'ลบผู้ใช้งาน' }).click();
    });
    await test.step('ตรวจว่าระบบแจ้งลบสำเร็จ', async () => {
      await expect(page.getByText('ลบผู้ใช้งานสำเร็จ')).toBeVisible();
      created = created.filter(x => x !== u.username);
      await okButton(page).click();
    });
    await test.step('ตรวจว่าผู้ใช้หายจากตาราง', async () => {
      await expect(userRow(page, u.username)).toHaveCount(0);
      await expect(page.getByText('ไม่พบข้อมูล')).toBeVisible();
    });
  });
});

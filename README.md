# เริ่มโปรเจกต์ Playwright ใหม่ + ส่งผลเข้า QA Pulse

คู่มือนี้สำหรับคนที่จะเริ่มโปรเจกต์เทสใหม่ด้วย Playwright (TypeScript) แล้วอยากให้ผลเทสขึ้นหน้า **QA Pulse – Test Result Dashboard** อัตโนมัติ ทำตามทีละขั้นได้เลย ไม่ต้องมีพื้นฐานมาก่อน

> **ระบบทำงานยังไง:** ทุกครั้งที่รัน `npx playwright test` จบ ไฟล์ `sheet-reporter.ts` จะส่งผลไปเก็บใน Google Sheet ของทีม QA แล้วหน้า Dashboard จะแสดงผลให้เอง โปรเจกต์ใหม่จะขึ้นใน Dashboard ตั้งแต่ส่งผลครั้งแรก ไม่ต้องไปตั้งค่าที่ Dashboard

---

## สารบัญ

0. [สิ่งที่ต้องมีก่อนเริ่ม](#0-สิ่งที่ต้องมีก่อนเริ่ม)
1. [สร้างโฟลเดอร์โปรเจกต์](#1-สร้างโฟลเดอร์โปรเจกต์)
2. [ติดตั้ง Playwright](#2-ติดตั้ง-playwright)
3. [ติดตั้ง dotenv](#3-ติดตั้ง-dotenv)
4. [สร้างไฟล์ reporter](#4-สร้างไฟล์-reporter)
5. [แก้ไฟล์ playwright.config.ts](#5-แก้ไฟล์-playwrightconfigts)
6. [สร้างไฟล์ .env และกันไม่ให้ขึ้น Git](#6-สร้างไฟล์-env-และกันไม่ให้ขึ้น-git)
7. [เขียนเทสให้ขึ้น Dashboard](#7-เขียนเทสให้ขึ้น-dashboard)
8. [ทดลองรันในเครื่อง](#8-ทดลองรันในเครื่อง)
9. [Publish to GitHub](#9-publish-to-github)
10. [ให้ GitHub ส่งผลอัตโนมัติ](#10-ให้-github-ส่งผลอัตโนมัติ)
11. [แก้ปัญหาที่พบบ่อย](#11-แก้ปัญหาที่พบบ่อย)
12. [กฎความปลอดภัย](#12-กฎความปลอดภัย)

---

## 0. สิ่งที่ต้องมีก่อนเริ่ม

- [ ] **Node.js เวอร์ชัน LTS** (เลขคู่ เช่น 22.x) เช็กด้วย `node -v` ถ้ายังไม่มี โหลดที่ https://nodejs.org
- [ ] **VS Code**
- [ ] **บัญชี GitHub** ที่เข้า Organization ของบริษัทได้
- [ ] **ค่า 2 ตัวจากผู้ดูแล QA Pulse:** `QA_HUB_URL` และ `QA_HUB_TOKEN`
  ขอทางแชตส่วนตัวเท่านั้น ห้ามโพสต์ในกลุ่ม และห้ามใส่ในไฟล์ที่ขึ้น Git
- [ ] **ตั้งรหัสโปรเจกต์ (Project ID)** เช่น `PRJ-BOOKING`
  - ใช้ได้เฉพาะตัวพิมพ์ใหญ่ A–Z ตัวเลข `-` และ `_`
  - ห้ามซ้ำกับโปรเจกต์อื่น (ดูรายชื่อที่มีอยู่แล้วได้ในหน้า Dashboard)

---

## 1. สร้างโฟลเดอร์โปรเจกต์

1. สร้างโฟลเดอร์ใหม่ในเครื่อง เช่น `Desktop\TS-PROJECT\Booking`
2. เปิด VS Code → **File → Open Folder…** → เลือกโฟลเดอร์นั้น
3. เปิด Terminal ใน VS Code: เมนู **Terminal → New Terminal**

---

## 2. ติดตั้ง Playwright

พิมพ์ใน Terminal:

```bash
npm init playwright@latest
```

จะมีคำถาม ให้ตอบตามนี้:

| คำถาม | ตอบ |
| --- | --- |
| Do you want to use TypeScript or JavaScript? | **TypeScript** |
| Where to put your end-to-end tests? | **tests** (กด Enter ใช้ค่าเดิม) |
| Add a GitHub Actions workflow? | **Y** (ใช่) |
| Install Playwright browsers? | **Y** (ใช่) |

รอจนขึ้น `Happy hacking! 🎭` ถือว่าเสร็จ

> ถ้าตอบชื่อโฟลเดอร์เทสเป็นอย่างอื่น (เช่น `Login`) ต้องไปแก้ `testDir` ในขั้นที่ 5 ให้ตรงด้วย

---

## 3. ติดตั้ง dotenv

dotenv ใช้อ่านค่าจากไฟล์ `.env` พิมพ์ใน Terminal:

```bash
npm install -D dotenv
```

---

## 4. สร้างไฟล์ reporter

ไฟล์นี้ทำหน้าที่ส่งผลเทสเข้า QA Pulse **ทุกโปรเจกต์ใช้ไฟล์เดียวกัน ไม่ต้องแก้อะไร**

1. ในแถบด้านซ้ายของ VS Code คลิกขวาที่พื้นที่ว่าง → **New Folder** → ตั้งชื่อ `reporters`
   โฟลเดอร์นี้ต้องอยู่ระดับเดียวกับไฟล์ `playwright.config.ts`
2. คลิกขวาที่โฟลเดอร์ `reporters` → **New File** → ตั้งชื่อ `sheet-reporter.ts`
3. คัดลอกโค้ดด้านล่างทั้งหมดไปวาง แล้วกด **Ctrl+S**

**`reporters/sheet-reporter.ts`**

```typescript
import path from 'node:path';
import type {
  FullConfig, FullResult, Reporter, Suite, TestCase, TestResult,
} from '@playwright/test/reporter';

// Scenario ID: ใส่เป็น tag เช่น @LG-17 หรือขึ้นต้นชื่อเทส เช่น 'LG-17 เข้าสู่ระบบ…'
const ID_TAG = /^@([A-Z][A-Z0-9]*(?:-[A-Z0-9]+)*-\d+)$/;
const ID_TITLE = /^([A-Z][A-Z0-9]*(?:-[A-Z0-9]+)*-\d+)(?=[\s:.)\]-]|$)/;
const PRIORITY_TAG: Record<string, string> = { '@high': 'High', '@medium': 'Medium', '@low': 'Low' };

type Scenario = {
  scenario_id: string; module: string; title: string; priority: string;
  precondition: string; expected: string; file: string;
  steps: string[]; steps_complete: boolean;
};
type Result = {
  scenario_id: string; status: 'Passed' | 'Failed' | 'Not Run';
  duration_ms: number; error: string; retry: number;
};

export default class SheetReporter implements Reporter {
  private scenarios = new Map<string, Scenario>();
  private results = new Map<string, Result>();

  /** ก่อนเริ่มรัน: อ่าน Scenario ทุกตัวจากไฟล์ .ts */
  onBegin(_config: FullConfig, suite: Suite) {
    for (const test of suite.allTests()) {
      const id = scenarioId(test);
      if (!id || this.scenarios.has(id)) continue;
      const note = (type: string) =>
        test.annotations.filter(a => a.type === type).map(a => a.description ?? '').join('\n');
      this.scenarios.set(id, {
        scenario_id: id,
        module: test.parent.type === 'describe'
          ? test.parent.title
          : path.basename(test.location.file).replace(/\.(spec|test)\.ts$/, ''),
        title: cleanTitle(test.title, id),
        priority: test.tags.map(t => PRIORITY_TAG[t.toLowerCase()]).find(Boolean) ?? '',
        precondition: note('precondition'),
        expected: note('expected'),
        file: path.relative(process.cwd(), test.location.file),
        steps: [],
        steps_complete: false,
      });
    }
  }

  /** test แต่ละตัวรันจบ: เก็บผล + ชื่อ test.step */
  onTestEnd(test: TestCase, result: TestResult) {
    const id = scenarioId(test);
    if (!id) return;
    const passed = result.status === 'passed';
    const browser = test.parent.project()?.name ?? '';
    const msg = redact(stripColor(result.error?.message ?? ''));
    this.results.set(`${id}::${browser}`, {      // retry จะเขียนทับ เหลือผลสุดท้ายของแต่ละ browser
      scenario_id: id,
      status: passed ? 'Passed' : result.status === 'skipped' ? 'Not Run' : 'Failed',
      duration_ms: result.duration,
      error: (msg && browser ? `[${browser}] ` : '') + msg.slice(0, 500),
      retry: result.retry,
    });
    const sc = this.scenarios.get(id);
    const steps = result.steps.filter(s => s.category === 'test.step').map(s => s.title);
    if (sc && steps.length) { sc.steps = steps; sc.steps_complete = passed; }
  }

  /** รันจบทั้งหมด: ส่งทุกอย่างไป Apps Script ครั้งเดียว */
  async onEnd(_result: FullResult) {
    const url = process.env.QA_HUB_URL;
    const token = process.env.QA_HUB_TOKEN;
    if (!url || !token) {
      console.log('[QA Hub] ไม่พบ QA_HUB_URL หรือ QA_HUB_TOKEN ข้ามการส่งผล');
      return;
    }
    if (!isSafeEndpoint(url)) {
      console.log('[QA Hub] QA_HUB_URL ต้องเป็น https://script.google.com/... เท่านั้น ข้ามการส่งผล');
      return;
    }
    const results = mergeBrowsers([...this.results.values()]);
    const ids = new Set(results.map(r => r.scenario_id));
    if (!results.length) {
      console.log('[QA Hub] ไม่มี test ที่ใส่ Scenario ID ไม่ได้ส่งผล');
      return;
    }
    const ci = process.env.GITHUB_RUN_ID
      ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
      : process.env.CI_PIPELINE_URL ?? '';                 // GitLab
    const payload = {
      token,
      run: {
        project_id: process.env.QA_PROJECT_ID ?? 'UNKNOWN',
        release: process.env.QA_RELEASE ?? '',
        env: process.env.QA_ENV ?? 'LOCAL',
        branch: process.env.GITHUB_REF_NAME ?? process.env.CI_COMMIT_REF_NAME ?? 'local',
        commit: (process.env.GITHUB_SHA ?? process.env.CI_COMMIT_SHA ?? '').slice(0, 7),
        report_url: ci,
        triggered_by: process.env.GITHUB_ACTOR ?? process.env.GITLAB_USER_LOGIN
          ?? process.env.USERNAME ?? process.env.USER ?? 'local',
      },
      scenarios: [...this.scenarios.values()].filter(s => ids.has(s.scenario_id)),
      results,
    };
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(60_000),             // ไม่ค้างเกิน 60 วินาที
      });
      const text = await res.text();
      if (text.trimStart().startsWith('<')) {
        console.log(`[QA Hub] ส่งไม่สำเร็จ: ได้หน้าเว็บกลับมาแทนผลลัพธ์ (HTTP ${res.status}) ` +
          '— เช็กว่า QA_HUB_URL ถูกต้อง ลงท้าย /exec และ Deploy เป็น Anyone');
      } else {
        console.log(`[QA Hub] ส่งผล ${payload.results.length} รายการ →`, text.slice(0, 300));
      }
    } catch (err) {
      console.log('[QA Hub] ส่งผลไม่สำเร็จ:', (err as Error).message);   // ไม่ทำให้ test fail
    }
  }

  printsToStdio() { return false; }
}

/** รันหลาย browser: ถ้ามี browser ไหนพัง ถือว่า Scenario นั้น Failed */
function mergeBrowsers(list: Result[]): Result[] {
  const rank = { 'Not Run': 0, Passed: 1, Failed: 2 };
  const out = new Map<string, Result>();
  for (const r of list) {
    const cur = out.get(r.scenario_id);
    if (!cur) { out.set(r.scenario_id, { ...r }); continue; }
    if (rank[r.status] > rank[cur.status]) cur.status = r.status;
    if (r.status === 'Failed') cur.error = [cur.error, r.error].filter(Boolean).join('\n');
    cur.duration_ms = Math.max(cur.duration_ms, r.duration_ms);
    cur.retry = Math.max(cur.retry, r.retry);
  }
  return [...out.values()];
}

/** หา Scenario ID: ดูจาก tag ก่อน ถ้าไม่มีดูจากต้นชื่อเทส */
function scenarioId(test: TestCase): string | undefined {
  for (const t of test.tags) {
    const m = ID_TAG.exec(t);
    if (m) return m[1];
  }
  return ID_TITLE.exec(test.title.trim())?.[1];
}

/** ตัดรหัสออกจากชื่อเทส: 'LG-17 เข้าสู่ระบบ' → 'เข้าสู่ระบบ' */
function cleanTitle(title: string, id: string) {
  const t = title.trim();
  return t.startsWith(id) ? t.slice(id.length).replace(/^[\s:.)\]–-]+/, '') || t : t;
}

/** ส่งได้เฉพาะ Apps Script ผ่าน https (localhost อนุญาตไว้ทดสอบ) */
function isSafeEndpoint(raw: string) {
  try {
    const u = new URL(raw);
    if (u.protocol === 'https:' && u.hostname === 'script.google.com') return true;
    return u.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(u.hostname);
  } catch { return false; }
}

/** ซ่อนรหัสผ่าน / token ที่อาจติดมากับข้อความ error ก่อนส่งออกไป */
function redact(text: string) {
  let out = text;
  for (const [key, value] of Object.entries(process.env)) {
    if (value && value.length >= 4 && /PASS|PWD|TOKEN|SECRET|KEY|AUTH|COOKIE/i.test(key)) {
      out = out.split(value).join('***');
    }
  }
  return out.replace(/(Bearer\s+)[\w.~+/=-]+/gi, '$1***');
}

function stripColor(s: string) {
  return s.replace(/\u001b\[[0-9;]*m/g, '');
}
```

---

## 5. แก้ไฟล์ playwright.config.ts

เปิดไฟล์ `playwright.config.ts` กด **Ctrl+A** แล้ววางโค้ดด้านล่างทับทั้งหมด จากนั้นกด **Ctrl+S**

**`playwright.config.ts`**

```typescript
import { defineConfig, devices } from '@playwright/test';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '.env'), quiet: true });

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['list'],                               // แสดงผลใน Terminal
    ['html', { open: 'never' }],            // report เต็ม (เหมือนเดิม)
    ['./reporters/sheet-reporter.ts'],      // ส่งผลเข้า QA Pulse
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('')`. */
    baseURL: process.env.BASE_URL,

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});
```

สิ่งที่ต่างจากไฟล์ตั้งต้นของ Playwright มีแค่ 2 จุด:

- บรรทัด `dotenv` ด้านบน (ไฟล์ตั้งต้นคอมเมนต์ไว้) → เปิดให้อ่านไฟล์ `.env`
- ส่วน `reporter` → เพิ่ม `./reporters/sheet-reporter.ts`

---

## 6. สร้างไฟล์ .env และกันไม่ให้ขึ้น Git

> ⚠️ **ต้องทำขั้นนี้ให้เสร็จก่อน Publish to GitHub** ไม่อย่างนั้น token จะหลุดขึ้น GitHub

### 6.1 สร้างไฟล์ `.env`

คลิกขวาในแถบด้านซ้าย → **New File** → ตั้งชื่อ `.env` (มีจุดข้างหน้า ไม่มีนามสกุลอื่น) แล้ววาง:

**`.env`**

```bash
# ได้จากผู้ดูแล QA Pulse (ทุกโปรเจกต์ใช้ค่าเดียวกัน)
QA_HUB_URL=https://script.google.com/macros/s/xxxxxxxxxxxxxxxx/exec
QA_HUB_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# ของโปรเจกต์นี้ (เปลี่ยนให้ตรง)
QA_PROJECT_ID=PRJ-BOOKING
QA_ENV=UAT
QA_RELEASE=v1.0.0
```

| ตัวแปร | ใส่อะไร | จำเป็น |
| --- | --- | --- |
| `QA_HUB_URL` | URL ที่ได้จากผู้ดูแล ต้องขึ้นต้น `https://script.google.com/` และลงท้าย `/exec` | ✅ |
| `QA_HUB_TOKEN` | token ที่ได้จากผู้ดูแล | ✅ |
| `QA_PROJECT_ID` | รหัสโปรเจกต์จากขั้นที่ 0 ห้ามซ้ำกับโปรเจกต์อื่น | ✅ |
| `QA_ENV` | เทสบน environment ไหน เช่น `UAT`, `SIT`, `PROD` | ไม่บังคับ |
| `QA_RELEASE` | เวอร์ชันที่กำลังเทส | ไม่บังคับ |

ข้อควรระวัง:

- ห้ามใส่เว้นวรรคหรือเครื่องหมายคำพูดรอบ `=` เช่น `QA_ENV = "UAT"` ❌ → `QA_ENV=UAT` ✅
- ถ้าสร้างไฟล์ด้วย Notepad ให้เลือก **Save as type: All Files** ไม่อย่างนั้นจะกลายเป็น `.env.txt`

### 6.2 เพิ่ม `.env` ใน `.gitignore`

เปิดไฟล์ `.gitignore` (Playwright สร้างไว้ให้แล้ว) แล้ว**เพิ่มบรรทัดนี้ต่อท้าย**:

```text
# ไฟล์รหัสลับ ห้ามขึ้น Git
.env
```

**เช็กว่าทำถูก:** ชื่อไฟล์ `.env` ในแถบด้านซ้ายของ VS Code ต้องเป็น**สีเทา**

---

## 7. เขียนเทสให้ขึ้น Dashboard

กติกาเดียวที่ต้องจำ: **ชื่อเทสต้องขึ้นต้นด้วยรหัส Scenario** เช่น `BK-1`, `BK-2`

```typescript
test('BK-1 จองห้องประชุมสำเร็จ', async ({ page }) => { ... });
```

- รหัส = ตัวอักษรพิมพ์ใหญ่ + `-` + ตัวเลข เช่น `BK-1`, `LG-17`, `PAY-003`
- รหัสต้องอยู่**หน้าสุด**ของชื่อ ห้ามมีอะไรนำหน้า (`[Booking] BK-1 …` ❌)
- 1 รหัส = 1 เทส ห้ามซ้ำกันในโปรเจกต์เดียวกัน
- ชื่อเทสที่ขึ้น Dashboard จะตัดรหัสออกให้เอง เช่น "จองห้องประชุมสำเร็จ"
- เทสที่**ไม่มี**รหัสก็ยังรันได้ตามปกติ แค่ไม่ถูกส่งเข้า Dashboard (เหมาะกับเทสที่กำลังลองเขียน)

### ใส่ข้อมูลเพิ่มให้ Dashboard (ไม่บังคับ แต่แนะนำ)

| อยากให้ Dashboard แสดง | เขียนแบบไหน |
| --- | --- |
| **Module** (หัวข้อกลุ่ม) | ครอบด้วย `test.describe('Booking', …)` |
| **Priority** | tag `@high`, `@medium` หรือ `@low` |
| **ขั้นตอน** | ใช้ `test.step('ชื่อขั้นตอน', …)` |
| **Precondition** | annotation `type: 'precondition'` |
| **Expected result** | annotation `type: 'expected'` |

ตัวอย่างไฟล์เทสเต็ม **`tests/booking.spec.ts`**

```typescript
import { test, expect } from '@playwright/test';

test.describe('Booking', () => {                         // ← Module

  test('BK-1 จองห้องประชุมสำเร็จ', {                       // ← รหัส + ชื่อ Scenario
    tag: '@high',                                        // ← Priority
    annotation: [
      { type: 'precondition', description: 'ผู้ใช้ล็อกอินแล้ว และมีห้องว่าง' },
      { type: 'expected', description: 'ระบบแสดงข้อความ "จองสำเร็จ" และห้องขึ้นในรายการจองของฉัน' },
    ],
  }, async ({ page }) => {
    await test.step('เปิดหน้าจองห้อง', async () => {       // ← ขั้นตอนที่ 1
      await page.goto('/booking');
    });
    await test.step('เลือกห้องและเวลา', async () => {       // ← ขั้นตอนที่ 2
      await page.getByLabel('ห้อง').selectOption('A101');
      await page.getByLabel('เวลา').fill('10:00');
    });
    await test.step('กดยืนยันการจอง', async () => {         // ← ขั้นตอนที่ 3
      await page.getByRole('button', { name: 'ยืนยัน' }).click();
    });
    await test.step('ตรวจว่าจองสำเร็จ', async () => {       // ← ขั้นตอนที่ 4
      await expect(page.getByText('จองสำเร็จ')).toBeVisible();
    });
  });

  test('BK-2 จองห้องที่ถูกจองแล้วไม่ได้', {
    tag: '@medium',
    annotation: { type: 'expected', description: 'แสดงข้อความ "ห้องนี้ถูกจองแล้ว"' },
  }, async ({ page }) => {
    await test.step('เปิดหน้าจองห้อง', async () => {
      await page.goto('/booking');
    });
    await test.step('เลือกห้องที่ถูกจองแล้ว แล้วกดยืนยัน', async () => {
      await page.getByLabel('ห้อง').selectOption('A102');
      await page.getByRole('button', { name: 'ยืนยัน' }).click();
    });
    await test.step('ตรวจข้อความแจ้งเตือน', async () => {
      await expect(page.getByText('ห้องนี้ถูกจองแล้ว')).toBeVisible();
    });
  });

  // เทสที่ไม่มีรหัสนำหน้า: รันได้ปกติ แต่ไม่ส่งเข้า Dashboard
  test('ลองเขียนเทสใหม่', async ({ page }) => {
    await page.goto('/booking');
  });
});
```

---

## 8. ทดลองรันในเครื่อง

```bash
npx playwright test
```

ดูบรรทัดท้ายๆ ใน Terminal:

| ข้อความที่เห็น | แปลว่า |
| --- | --- |
| `[QA Hub] ส่งผล 12 รายการ → {"ok":true,...}` | ✅ สำเร็จ เปิด Dashboard จะเห็นโปรเจกต์ใหม่ (กดปุ่ม ⟳ มุมขวาบนถ้ายังไม่ขึ้น) |
| `[QA Hub] ไม่มี test ที่ใส่ Scenario ID` | ชื่อเทสยังไม่ขึ้นต้นด้วยรหัส (ดูขั้นที่ 7) |
| `[QA Hub] ไม่พบ QA_HUB_URL หรือ QA_HUB_TOKEN` | อ่านไฟล์ `.env` ไม่เจอ (ดูข้อ 11) |
| `{"ok":false,"error":"unauthorized"}` | token ผิด ขอค่าใหม่จากผู้ดูแล |
| `{"ok":false,"error":"invalid project_id"}` | `QA_PROJECT_ID` มีตัวพิมพ์เล็กหรืออักขระพิเศษ |

> ถ้ารันหลาย browser (chromium, firefox, webkit) ระบบจะรวมผลเป็น 1 รายการต่อ Scenario ถ้า browser ไหนพัง จะนับว่า Failed และบอกว่าพังที่ browser ไหน

---

## 9. Publish to GitHub

1. ก่อน Publish เช็กอีกรอบว่า `.env` เป็นสีเทาแล้ว (ขั้นที่ 6.2)
2. แถบซ้ายของ VS Code กดไอคอน **Source Control** → **Publish to GitHub**
3. เลือก **Publish to GitHub private repository**
4. ถ้ามีหน้าต่างให้เลือกไฟล์ ต้อง**ไม่มี** `.env` อยู่ในรายการ

---

## 10. ให้ GitHub ส่งผลอัตโนมัติ

ทำขั้นนี้เพื่อให้ GitHub รันเทสและส่งผลเองทุกครั้งที่ push ถ้ารันแค่ในเครื่องจะข้ามขั้นนี้ไปก่อนก็ได้

### 10.1 ใส่ Secret ใน GitHub

ไปที่หน้า repo บน GitHub → **Settings → Secrets and variables → Actions → New repository secret** แล้วเพิ่มทีละตัว:

| Name | Secret |
| --- | --- |
| `QA_HUB_URL` | ค่าเดียวกับใน `.env` |
| `QA_HUB_TOKEN` | ค่าเดียวกับใน `.env` |

> ถ้าผู้ดูแลตั้งเป็น **Organization secret** ไว้แล้ว ข้ามข้อนี้ได้เลย

### 10.2 แก้ไฟล์ workflow

เปิดไฟล์ `.github/workflows/playwright.yml` กด **Ctrl+A** แล้ววางทับด้วยโค้ดนี้ **แก้แค่ `QA_PROJECT_ID`** ให้ตรงกับโปรเจกต์

**`.github/workflows/playwright.yml`**

```yaml
name: Playwright Tests

on:
  push:
    branches: [ main, master ]
  pull_request:
    branches: [ main, master ]
  workflow_dispatch:            # มีปุ่ม "Run workflow" ให้กดรันเองในแท็บ Actions

jobs:
  test:
    timeout-minutes: 60
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: lts/*
    - name: Install dependencies
      run: npm ci
    - name: Install Playwright Browsers
      run: npx playwright install --with-deps
    - name: Run Playwright tests
      run: npx playwright test
      env:
        QA_HUB_URL: ${{ secrets.QA_HUB_URL }}       # ตั้งในขั้น 10.1
        QA_HUB_TOKEN: ${{ secrets.QA_HUB_TOKEN }}   # ตั้งในขั้น 10.1
        QA_PROJECT_ID: PRJ-BOOKING                  # ← แก้เป็นรหัสโปรเจกต์ของคุณ
        QA_ENV: UAT
    - uses: actions/upload-artifact@v4
      if: ${{ !cancelled() }}
      with:
        name: playwright-report
        path: playwright-report/
        retention-days: 30
```

### 10.3 Push แล้วดูผล

1. Commit และ Push ไฟล์ที่แก้
2. ที่หน้า repo กดแท็บ **Actions** จะเห็นงานกำลังรัน
3. พอเสร็จ กดเข้าไปที่ขั้น **Run Playwright tests** จะเห็นบรรทัด `[QA Hub] ส่งผล … {"ok":true,...}`
4. บน Dashboard ปุ่ม **เปิด Playwright Report** จะลิงก์มาที่หน้ารันนี้ (ดาวน์โหลด report เต็มได้ที่ส่วน Artifacts)

---

## 11. แก้ปัญหาที่พบบ่อย

| อาการ | วิธีแก้ |
| --- | --- |
| ไม่มีบรรทัด `[QA Hub]` เลย | เช็กว่าใน `playwright.config.ts` มี `./reporters/sheet-reporter.ts` และโฟลเดอร์ `reporters` อยู่ระดับเดียวกับ config |
| `ไม่พบ QA_HUB_URL หรือ QA_HUB_TOKEN` | ไฟล์ `.env` ยังไม่ได้เซฟ / ชื่อไฟล์ผิด (เช่น `.env.txt`) / ชื่อตัวแปรพิมพ์ผิด ทดสอบด้วย `node -e "require('dotenv').config(); console.log(process.env.QA_HUB_URL)"` ต้องเห็น URL ไม่ใช่ `undefined` |
| `ได้หน้าเว็บกลับมาแทนผลลัพธ์` | URL ผิด: ต้องลงท้าย `/exec` และห้ามมี `/u/0/` หรือ `/u/1/` ใน URL ถ้ายังไม่ได้ ถามผู้ดูแล |
| `QA_HUB_URL ต้องเป็น https://script.google.com/...` | URL ไม่ได้ขึ้นต้นด้วย `https://script.google.com/` |
| `unauthorized` | token ผิด หรือผู้ดูแลเปลี่ยน token แล้ว ขอค่าใหม่ |
| `too many requests` | ส่งเกิน 30 ครั้งต่อนาที รอ 1 นาทีแล้วรันใหม่ |
| ผลขึ้นชีตแต่ไม่เห็นใน Dashboard | กดปุ่ม ⟳ มุมขวาบนของ Dashboard |
| บน GitHub ไม่ส่งผล แต่ในเครื่องส่งได้ | ยังไม่ได้ทำขั้น 10.1 หรือ 10.2 (ไฟล์ workflow ต้องมีส่วน `env:`) |
| `Assertion failed: … UV_HANDLE_CLOSING … async.c` ตอนจบ | บั๊กของ Node บน Windows ไม่กระทบผล ถ้าอยากให้หาย ใช้ Node เวอร์ชัน LTS |

---

## 12. กฎความปลอดภัย

- ❌ ห้าม commit ไฟล์ `.env` ขึ้น Git
- ❌ ห้ามส่ง `QA_HUB_TOKEN` ในแชตกลุ่ม อีเมล หรือเอกสารที่แชร์
- ❌ ห้ามเขียนรหัสผ่านตรงๆ ในไฟล์เทส ให้อ่านจาก `.env` เช่น `process.env.TEST_PASSWORD`
  (ระบบจะซ่อนค่าของตัวแปรที่ชื่อมี PASS / TOKEN / SECRET / KEY ไม่ให้ไปโผล่ใน Dashboard)
- ❌ ห้ามแก้ไฟล์ `reporters/sheet-reporter.ts` เอง ถ้าต้องการฟีเจอร์เพิ่ม แจ้งผู้ดูแล
- ✅ ถ้าเผลอทำ token หลุด แจ้งผู้ดูแลทันที เพื่อเปลี่ยน token ใหม่

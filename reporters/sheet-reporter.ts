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
    const msg = stripColor(result.error?.message ?? '');
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
      });
      console.log(`[QA Hub] ส่งผล ${payload.results.length} รายการ →`, await res.text());
    } catch (err) {
      console.log('[QA Hub] ส่งผลไม่สำเร็จ:', err);   // ไม่ทำให้ test fail
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

function stripColor(s: string) {
  return s.replace(/\u001b\[[0-9;]*m/g, '');
}
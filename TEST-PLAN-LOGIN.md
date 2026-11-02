# Test Plan: เข้าสู่ระบบ (Login) — Legal System (UAT)

- URL: https://uat-legal.planbmedia.co.th/
- ขอบเขต: เฉพาะการเข้าสู่ระบบด้วย Username/Password
- นอกขอบเขต: การเชื่อมต่อ/Login ด้วย Google
- ข้อมูลทดสอบ: อ่านจาก `.env` (`BASE_URL`, `TEST_USERNAME`, `TEST_PASSWORD`)
- เครื่องมือ: Playwright (chromium / firefox / webkit)

> หมายเหตุ: หน้าเว็บเป็น SPA (โหลดด้วย JS) จึงยังไม่ได้ยืนยัน selector/ข้อความ error จริง
> ต้องตรวจด้วย `npx playwright codegen` ก่อนเขียนสคริปต์ และปรับ Expected Result ให้ตรงกับระบบ

## 1. Functional — Positive
| ID | Test case | ขั้นตอน | Expected |
|----|-----------|---------|----------|
| LG-01 | Login สำเร็จ | กรอก user/pass ที่ถูกต้อง กดเข้าสู่ระบบ | เข้าสู่หน้าหลัก/Dashboard, URL เปลี่ยนจากหน้า login, แสดงชื่อผู้ใช้ |
| LG-02 | Login ด้วย Enter | กรอกข้อมูลถูกต้อง กด Enter | เข้าสู่ระบบสำเร็จเหมือน LG-01 |
| LG-03 | Session คงอยู่ | Login แล้ว Refresh หน้า | ยังอยู่ในระบบ ไม่ถูกเด้งไปหน้า login |
| LG-04 | Logout | Login แล้วกดออกจากระบบ | กลับหน้า login, กด Back แล้วไม่เข้าหน้าภายในได้ |

## 2. Functional — Negative
| ID | Test case | ขั้นตอน | Expected |
|----|-----------|---------|----------|
| LG-05 | รหัสผ่านผิด | user ถูก + pass ผิด | แสดง error, ไม่ login, ไม่บอกว่าผิดที่ช่องใดโดยเฉพาะ |
| LG-06 | Username ไม่มีในระบบ | user ผิด + pass ใดๆ | แสดง error แบบเดียวกับ LG-05 |
| LG-07 | เว้นว่างทั้งสองช่อง | กดเข้าสู่ระบบ | แสดงข้อความ required ทั้งสองช่อง |
| LG-08 | เว้นว่าง Username | กรอกเฉพาะ pass | แสดง required ที่ Username |
| LG-09 | เว้นว่าง Password | กรอกเฉพาะ user | แสดง required ที่ Password |
| LG-10 | ช่องว่างหน้า/หลัง Username | ` raveewan.ka ` + pass ถูก | บันทึกพฤติกรรม (trim แล้วเข้าได้ หรือ error) ให้สอดคล้อง spec |
| LG-11 | Username case sensitivity | `RAVEEWAN.KA` + pass ถูก | บันทึกพฤติกรรมตาม spec |
| LG-12 | Password case sensitivity | pass ตัวพิมพ์ต่างจากเดิม | ต้อง login ไม่ได้ |

## 3. Security
| ID | Test case | Expected |
|----|-----------|----------|
| LG-13 | Password masking | ช่อง password เป็น `type=password` ไม่แสดงเป็นข้อความ |
| LG-14 | Show/Hide password (ถ้ามี) | สลับแสดง/ซ่อนได้ถูกต้อง |
| LG-15 | SQL injection (`' OR 1=1 --`) | ไม่ login, ไม่มี error จากฐานข้อมูลรั่วออกมา |
| LG-16 | XSS (`<script>alert(1)</script>`) | ไม่ execute script, ไม่สะท้อนโดยไม่ escape |
| LG-17 | เข้าหน้าภายในโดยตรงก่อน login | Redirect กลับหน้า login |
| LG-18 | Login ผิดซ้ำหลายครั้ง (เช่น 5–10) | ตรวจ lockout/captcha/rate-limit ตาม spec (**ระวังล็อกบัญชีทดสอบ — ใช้ user สำรอง/ยืนยันกับทีมก่อน**) |
| LG-19 | HTTPS | ใช้ HTTPS, credential ไม่อยู่ใน URL/query string |
| LG-20 | Autocomplete / Cache | หลัง logout กด Back ไม่เห็นข้อมูลภายใน |
| LG-21 | Session cookie | ตรวจ flag HttpOnly/Secure และ cookie หายหลัง logout |

## 4. UI / UX
| ID | Test case | Expected |
|----|-----------|----------|
| LG-22 | องค์ประกอบหน้า login | มี logo/ชื่อระบบ, ช่อง Username, Password, ปุ่มเข้าสู่ระบบ ครบ |
| LG-23 | Placeholder/Label/ข้อความไทย | สะกดถูก ภาษาไม่ปนผิดที่ |
| LG-24 | Tab order | Username → Password → ปุ่ม login |
| LG-25 | Focus เริ่มต้น | Cursor อยู่ช่อง Username (ถ้าเป็น spec) |
| LG-26 | Loading state | ปุ่ม disable/แสดง loading ระหว่างส่ง ป้องกันกดซ้ำ |
| LG-27 | Responsive | Desktop (1920/1366), Tablet, Mobile (375) แสดงผลไม่เพี้ยน |
| LG-28 | ล้าง error | แก้ไขข้อมูลแล้ว error เก่าหายตามที่ควร |
| LG-29 | Copy/Paste | วาง username/password ได้ตามปกติ |

## 5. Boundary / Input
| ID | Test case | Expected |
|----|-----------|----------|
| LG-30 | ข้อความยาวมาก (เช่น 256+/1000 ตัวอักษร) | ไม่ crash, มี error/ตัดความยาวตาม spec |
| LG-31 | อักขระพิเศษ/ภาษาไทย/emoji | ไม่ crash, แสดง error ที่เหมาะสม |
| LG-32 | Double click ปุ่ม login | ส่ง request เดียว ไม่เกิด error |

## 6. Compatibility & Non-functional
| ID | Test case | Expected |
|----|-----------|----------|
| LG-33 | Cross-browser | Chromium, Firefox, WebKit ผ่านเหมือนกัน |
| LG-34 | Performance | หน้า login โหลดและ login เสร็จในเวลาที่ยอมรับได้ (เช่น < 3 วินาที) |
| LG-35 | Network ช้า/ตัด | แสดงข้อความ error ที่เหมาะสม ไม่ค้าง |
| LG-36 | Console errors | ไม่มี JS error บนหน้า login |

## 7. ลำดับความสำคัญ
- **P0 (smoke):** LG-01, 05, 07, 13, 17, 04
- **P1:** LG-02, 03, 06, 08, 09, 15, 16, 22, 26
- **P2:** ที่เหลือ

## 8. แผนการลงมือ
1. รัน `npx playwright codegen https://uat-legal.planbmedia.co.th/` เพื่อยืนยัน selector และข้อความ error จริง
2. ติดตั้ง `dotenv` แล้วเปิดใช้บรรทัด dotenv ใน `playwright.config.ts` + ตั้ง `baseURL` จาก `BASE_URL`
3. เขียน `tests/login.spec.ts` เริ่มจาก P0 → P1 → P2
4. เคสที่ต้องทำด้วยมือ/ตรวจร่วมกับทีม: LG-18, LG-21, LG-27
5. รายงานผลด้วย HTML reporter ของ Playwright

## 9. สมมติฐาน / ข้อควรยืนยัน
- มีกฎ password policy, lockout, captcha หรือไม่
- Username case-sensitive หรือไม่
- มี "จดจำฉัน" / "ลืมรหัสผ่าน" หรือไม่ (ถ้ามี ให้เพิ่มเคส)
- หน้าแรกหลัง login ควรเป็นหน้าใด และสิทธิ์ของ user `raveewan.ka`

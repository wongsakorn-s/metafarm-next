# Security review — Phase 6

อัปเดต 30 กันยายน 2026; ตรวจ source, automated tests และ local Cloudflare Worker เท่านั้น ไม่ใช่ผลตรวจ staging/production

| หัวข้อ | ผลตรวจ | ระดับหลักฐาน / หมายเหตุ |
| --- | --- | --- |
| Static response headers | `public/_headers` กำหนด CSP, `Permissions-Policy: camera=(self)`, HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options` | ตรวจ response จาก local Worker ด้วย Playwright; ยังไม่ตรวจ staging |
| API headers และ cache | API ได้ CSP แบบปิดเนื้อหาอื่น, HSTS, Permissions-Policy และ `Cache-Control: private, no-store` | Playwright กับ local Worker |
| Authentication | `/api/*` ผ่าน Cloudflare Access/ผู้ใช้ development ทุก request; `/health/ready` ต้องเป็น owner/staff; `/health` เปิดเฉพาะ liveness ที่ไม่มีข้อมูล DB | unit/local Worker; ต้องยืนยัน Access จริงบน staging |
| Upload | จำกัดขนาดและตรวจ MIME signature ก่อน R2; key ใช้ UUID, bucket เป็น private และ public API ตรวจ session | unit/smoke development ที่ไม่มีการอัปโหลด R2 remote ในรอบ Phase 6; ยังไม่แทนการสแกนไฟล์ malware |
| Dependency audit | พบ `esbuild <=0.24.2` ระดับ moderate ซึ่งมาจาก `drizzle-kit` → `@esbuild-kit/esm-loader` → `@esbuild-kit/core-utils`; Vite/Wrangler ใช้ esbuild รุ่นใหม่กว่า | `bun audit` วันที่ 30 ก.ย. 2026; อยู่ใน dev dependency tree ไม่ใช่ runtime Worker; ยังไม่ได้แทน loader จึงเป็นความเสี่ยงคงเหลือ |
| CI isolation | Worker integration ทำงานได้เมื่อมี Neon branch เฉพาะ CI; guard ปฏิเสธ host ของ dev/staging/production และ Worker ใช้ R2 emulator ในเครื่อง | workflow เพิ่มแล้ว; ยังไม่มี GitHub run ยืนยันเพราะยังไม่ได้ตั้ง secret/variable |
| Automated accessibility/layout | axe ตรวจ serious/critical และ Playwright ทดสอบ public/admin พร้อม viewport 320–1440px | browser automation local; ไม่มีผลทดสอบอุปกรณ์จริง |

## การตั้งค่า CI integration ที่ยังขาด

- GitHub Actions secret `NEON_DATABASE_URL_CI`: connection string ของ Neon branch ที่สร้างไว้เพื่อ CI โดยเฉพาะ
- GitHub Actions variable `NEON_CI_DATABASE_HOST`: hostname ของ branch เดียวกัน โดยต้องไม่ตรงกับ development, staging หรือ production
- ห้ามใช้ secret หรือ branch ของ production; workflow ไม่ deploy และห้ามนำข้อมูลลูกค้าจริงเข้าชุดทดสอบ

## ความเสี่ยงและงานติดตาม

- เปลี่ยน/อัปเกรด Drizzle tooling เมื่อ upstream เอา `@esbuild-kit` รุ่นเก่าออก หรือเลือกยอมรับ dev-only advisory พร้อมทบทวนเป็นระยะ; อย่า override esbuild แบบ global เพราะ Wrangler ต้องใช้เวอร์ชันที่ระบุเฉพาะ
- ตั้ง CI Neon branch และเปิด GitHub Actions เพื่อยืนยัน worker integration จริง
- ทดสอบ Access login, role owner/staff, R2 upload/read, QR และ restore บน staging โดยใช้ข้อมูล QA ที่ลบได้
- ไม่มีการ deploy หรือเขียน staging/production ระหว่าง Phase นี้

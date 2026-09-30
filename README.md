# MetaFarm Next

แอปใหม่ของ MetaFarm สำหรับเว็บสาธารณะและหลังบ้านเจ้าของ/ทีม 2–10 คน จัดการรัง ผลผลิต บันทึกตรวจ และรูปภาพ แยกจากโปรเจกต์เดิมโดยสิ้นเชิง **ยังไม่ย้ายข้อมูลเดิมหรือเปลี่ยน production เดิม**

## Tech stack

- Frontend: React 19 + TypeScript + Vite + Tailwind CSS 4, functional components/hooks, PWA (ไม่มี offline writes)
- Backend: Express 5 + TypeScript บน Cloudflare Workers, REST API พร้อม Zod validation และ error handling
- Database: PostgreSQL บน Neon Free + Drizzle ORM
- รูป: Cloudflare R2 private bucket; Auth: Cloudflare Access email OTP + role ใน PostgreSQL
- Deploy: เว็บ static + API Worker ใน **Cloudflare deployment เดียว**; Neon เป็นผู้ให้บริการฐานข้อมูลแยก

## รันบนเครื่อง

```sh
bun install
cp .dev.vars.example .dev.vars
```

แก้ `DATABASE_URL`, `OWNER_EMAIL`, `DEV_AUTH_EMAIL` ใน `.dev.vars` ให้ใช้บัญชีทดสอบ และคง `ENVIRONMENT=development` ไว้ โดย `DATABASE_URL` ต้องชี้ Neon branch `development` ของโปรเจกต์นี้เท่านั้น (ดู hostname ตัวอย่างใน `.dev.vars.example`) คำสั่ง local จะตรวจ hostname ก่อนรันเพื่อป้องกันการใช้ฐาน production โดยไม่ตั้งใจ:

```sh
bun run db:migrate:local
bun run build
bun run dev:api
```

เปิดอีก terminal แล้วรัน `bun run dev:web` เว็บอยู่ที่ `http://127.0.0.1:5173` และ proxy API ไป `http://127.0.0.1:8787` การข้าม Access ด้วย `DEV_AUTH_EMAIL` ทำงานเฉพาะเมื่อ `ENVIRONMENT=development`, เรียกผ่าน localhost และยังไม่มี `ACCESS_AUD` เท่านั้น ห้ามกำหนดสองตัวแปรนี้ใน production

Neon branch `development` ที่ใช้ในโปรเจกต์นี้สร้างแบบ **schema only** และบันทึก baseline ของ migration แรกไว้แล้ว จึงรัน `db:migrate:local` ต่อได้ตามปกติ หากสร้าง branch schema-only ใหม่ อย่ารัน migration ทันทีโดยไม่ตรวจประวัติ `drizzle.__drizzle_migrations` เพราะอาจพยายามสร้างตารางที่มีอยู่แล้ว

ตรวจคุณภาพ:

```sh
bun run gen
bun run check
bun run test
bun run build
```

ขั้นตอนขึ้น production: [DEPLOYMENT.md](DEPLOYMENT.md) (deploy ผ่าน GitHub Actions เท่านั้น; `bun run deploy` ถูกปิดไว้เพื่อไม่ให้ข้ามตัวตรวจเป้าหมายและ migration)

## ขอบเขต

รองรับสร้าง/แก้ไข/เก็บถาวรรัง, QR ของรัง, เพิ่มและแก้ไขผลผลิต/บันทึกตรวจพร้อมรูป (staff แก้รายการของตัวเองได้ภายใน 24 ชั่วโมง, owner แก้และลบแบบ soft delete ได้ พร้อมประวัติ audit), เปิด/ปิดสิทธิ์ทีมงาน และส่งออก/สำรองข้อมูล ยังไม่มีระบบขาย, offline writes หรือ migration ข้อมูลเดิม หน้า public เป็นเนื้อหาตัวอย่าง ต้องยืนยันข้อมูลฟาร์มก่อนเผยแพร่จริง

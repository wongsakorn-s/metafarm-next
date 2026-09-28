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

แก้ `DATABASE_URL`, `OWNER_EMAIL`, `DEV_AUTH_EMAIL` ใน `.dev.vars` เป็นค่าทดสอบ และเปิด Neon database แล้ว:

```sh
bun run db:migrate:local
bun run build
bun run dev:api
```

เปิดอีก terminal แล้วรัน `bun run dev:web` เว็บอยู่ที่ `http://127.0.0.1:5173` และ proxy API ไป `http://127.0.0.1:8787` การข้าม Access ด้วย `DEV_AUTH_EMAIL` ทำงานเฉพาะ localhost เมื่อยังไม่มี `ACCESS_AUD` เท่านั้น ห้ามกำหนดตัวแปรนี้ใน production

ตรวจคุณภาพ:

```sh
bun run gen
bun run check
bun run test
bun run build
```

ขั้นตอนขึ้น production: [DEPLOYMENT.md](DEPLOYMENT.md)

## ขอบเขต

รองรับสร้าง/แก้ไขรัง เพิ่มผลผลิต บันทึกตรวจพร้อมรูป และเปิด/ปิดสิทธิ์ทีมงาน ยังไม่มีระบบขาย, offline writes, ลบประวัติ, แก้ไขผลผลิตย้อนหลัง หรือ migration ข้อมูลเดิม หน้า public เป็นเนื้อหาตัวอย่าง ต้องยืนยันข้อมูลฟาร์มก่อนเผยแพร่จริง

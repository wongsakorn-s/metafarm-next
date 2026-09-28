# Deploy บน Free Tier

การ deploy frontend และ Express API จบใน Cloudflare Workers ครั้งเดียว โดยใช้ Neon PostgreSQL เป็นฐานข้อมูลภายนอก หลังเตรียม Neon, R2, Access และ secrets ครั้งแรกแล้ว GitHub Actions `Deploy production` จะตรวจโค้ด → ทดสอบ → migrate PostgreSQL → build → deploy ใน workflow เดียว

## สถานะการเตรียมระบบ (28 กันยายน 2026)

- Neon schema ถูก migrate แล้ว; R2 bucket `metafarm-next-media` ถูกสร้างแล้ว
- สร้าง Neon branch `staging` แบบ schema-only พร้อม migration baseline และ R2 bucket `metafarm-next-media-staging` แล้ว; Worker `metafarm-next-staging` ถูกอัปโหลดโดย **ยังไม่มี public route** (`workers_dev: false`) และมี secrets `DATABASE_URL`, `OWNER_EMAIL`, `ACCESS_TEAM_DOMAIN`, `ACCESS_AUD` ครบแล้ว
- มี Neon branch `development` แบบ schema-only สำหรับรัน local โดยแยกจาก branch `production`; `.dev.vars` บนเครื่องนี้ชี้ development แล้ว และคำสั่ง local ตรวจ hostname ก่อนใช้ฐานข้อมูล
- Zero Trust Free เปิดใช้งานแล้ว และ Access app `MetaFarm Next admin` ครอบ hostname `metafarm-next.wong-saengsurasak.workers.dev` ทั้งหมด รวมทั้ง `/admin*` และ `/api/*` ด้วยนโยบายอีเมลเจ้าของ
- Worker `metafarm-next` มี secrets `DATABASE_URL`, `OWNER_EMAIL`, `ACCESS_TEAM_DOMAIN`, `ACCESS_AUD` แล้ว เปิด `workers_dev: true` และคง `preview_urls: false` เป็น **private staging** ที่ `https://metafarm-next.wong-saengsurasak.workers.dev` (ต้องผ่าน Access ก่อนเห็นทุกหน้า)
- ตรวจแล้วว่า request ไม่ล็อกอินไปยัง `/`, `/admin`, `/api/me`, `/health` และไฟล์ asset ถูกส่งไปหน้า Access; บัญชีเจ้าของเข้า `/admin`, `/api/me` และ `/api/dashboard` ได้
- หน้าเว็บผู้ชมยังเป็นเนื้อหาตัวอย่าง ต้องยืนยันข้อมูลฟาร์มก่อนเปิดให้คนทั่วไปเข้าชม
- GitHub billing กลับมาใช้งานได้แล้ว: [CI run #2](https://github.com/wongsakorn-s/metafarm-next/actions/runs/36440871524) บน `main` ผ่านครบ (test 8/8) เมื่อ 28 กันยายน 2026
- GitHub repo ยังไม่มี Actions secrets; workflow `Deploy production` ยังรันไม่ได้จนกว่าจะตั้ง `NEON_DATABASE_URL`, `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` และตรวจเป้าหมาย deploy ตามขั้นตอนด้านล่าง
- GitHub Environment `staging` สร้างแล้ว แต่ยังไม่ได้จำกัด branch และยังไม่มี environment secrets
- **ยังไม่แยก staging ออกจาก production ทั้งหมด:** Worker เดิม `metafarm-next` ยังใช้ Neon branch `production` และ R2 bucket หลัก ส่วน Worker `metafarm-next-staging` ยังไม่มี public route แม้ตั้ง secrets แล้ว อย่าใช้ Worker เดิมทดสอบการเขียนข้อมูลที่เสี่ยงหรือรัน migration ทดลอง
- ลองเพิ่ม hostname staging ใน Access app เดิมแล้วพบว่า callback หลังล็อกอินพาไป hostname ของ Worker เดิม จึงปิด route staging กลับทันที ต้องย้าย hostname ไป Access app แยกก่อนเปิด staging อีกครั้ง

## แยก staging ให้พร้อมใช้งาน

1. สร้าง Cloudflare Access app **แยกสำหรับ staging** ให้ครอบ `metafarm-next-staging.wong-saengsurasak.workers.dev` ทั้ง hostname โดยใช้นโยบาย `MetaFarm owner` เดิม **ก่อน** เปิด `workers_dev` บน Worker staging อย่ารวม hostname นี้กับ Access app ของ Worker เดิม: ทดสอบแล้วว่า callback หลังล็อกอินถูกส่งไป hostname แรกของ app เดิม
2. ยืนยันว่า Worker staging secrets ทั้งสี่รายการยังอยู่ ตั้ง `ACCESS_AUD` ใหม่ให้ตรงกับ Access app staging และ `ACCESS_TEAM_DOMAIN` เป็น team domain เดิม ห้ามตั้ง `DEV_AUTH_EMAIL`
3. เปลี่ยน `workers_dev` ใน `wrangler.staging.jsonc` เป็น `true` แล้ว deploy staging; ตรวจว่า request ไม่ล็อกอินถูกส่งไป Access ก่อนเห็นหน้าเว็บ/API
4. จำกัด GitHub Environment `staging` ให้ deploy จาก `main` เท่านั้น แล้วตั้ง secrets `NEON_DATABASE_URL` (branch staging), `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` ให้ครบ ก่อนสั่ง workflow `Deploy staging` ซึ่งตรวจ hostname Neon, Worker name และ R2 bucket อัตโนมัติก่อน migrate/deploy
5. ทดสอบบัญชีเจ้าของและทีมงาน รวมถึงการอัปโหลด/อ่านรูปใน bucket staging และยืนยันว่าข้อมูล production ไม่เปลี่ยน

Workflow `Deploy production` มีตัวตรวจเป้าหมาย production เช่นกัน แต่ยังไม่ควรรันจนกว่าจะกำหนด production environment/secrets และผ่านการเปิดตัวเว็บสาธารณะตามรายการด้านล่าง

## ผลทดสอบ private staging (28 กันยายน 2026)

- `bun run check`, `bun run test` (8/8) และ `bun run build` ผ่าน; deploy เวอร์ชันที่แก้วันเริ่มต้นตามเวลาไทยและเพิ่มปุ่มแนบ/เปลี่ยนรูปในบันทึกการตรวจแล้ว
- บัญชีเจ้าของเพิ่ม/แก้ไขรัง บันทึกผลผลิต และบันทึกการตรวจผ่านหน้า `/admin` ได้; ตรวจพบข้อมูลใน Neon แล้วลบข้อมูล QA ทั้งหมด (รัง 1, ผลผลิต 1, การตรวจ 1) และยืนยันว่าแดชบอร์ดกลับเป็นศูนย์
- API อัปโหลด/อ่านรูป JPEG ได้เมื่อทดสอบด้วย Wrangler local ทั้ง R2 local และ remote; รูปที่อ่านกลับจาก R2 remote มี SHA-256 ตรงกับต้นฉบับ และบัญชีเจ้าของเปิดรูปเดียวกันผ่าน Worker production ได้ แล้วลบออบเจ็กต์ QA ออกจาก R2
- บัญชีทีมงานจำลองใน local ได้ role `staff` และอ่านแดชบอร์ดโดยไม่เห็นรายชื่อทีมงาน; เพิ่มทีมงานถูกปฏิเสธ (`403`); เมื่อปิดสิทธิ์แล้ว `/api/me` ถูกปฏิเสธ (`403`) และลบบัญชี QA แล้ว
- Request ที่ไม่ล็อกอินไปยัง `/`, `/admin`, `/api/me`, `/api/dashboard` และ API รูปถูกส่งไป Cloudflare Access (`302`)
- ตรวจหน้าเว็บผู้ชมและหลังบ้านที่ viewport มือถือกว้าง 390px แล้ว ไม่มีส่วนหลักล้นขอบ และ build สร้าง PWA manifest/service worker สำเร็จ
- ยังต้องทดสอบการเลือกไฟล์ผ่าน UI บน staging และบัญชีทีมงานจริง เบราว์เซอร์ทดสอบยังไม่มีสิทธิ์ให้ extension เลือกไฟล์ในเครื่อง และ Access policy ปัจจุบันอนุญาตเฉพาะเจ้าของ

## เปิดหน้าเว็บให้คนทั่วไปเมื่อพร้อม

1. แทนข้อมูลตัวอย่างบนหน้าเว็บด้วยข้อมูลฟาร์มที่ยืนยันแล้ว และตรวจว่ารูป/ข้อความที่เผยแพร่ได้ไม่มีข้อมูลส่วนตัว
2. ใน Access app เอา destination ที่ครอบ hostname ทั้งหมดออก **หลังจาก** ยืนยันข้อมูลหน้าเว็บแล้ว โดยคง destination `/admin*` และ `/api/*` พร้อมนโยบายอีเมลเจ้าของไว้ หากเพิ่ม custom domain ต้องเพิ่ม hostname/path ใหม่ใน Access ก่อนเปิดใช้งาน
3. ทดสอบ `bun run check`, `bun run test`, `bun run build` และตรวจ migration/backups ของ Neon
4. ทดสอบ `/` แบบไม่ล็อกอิน, `/admin` แบบล็อกอิน, `/api/me` ทั้งบัญชีที่อนุญาตและไม่อนุญาต, CRUD และอัปโหลด/อ่านรูป R2 จริง ก่อนประกาศ URL ให้ผู้ชม

## เตรียมครั้งแรก

1. สร้างโปรเจกต์ Neon Free และคัดลอก PostgreSQL connection string แบบ `sslmode=require` เก็บเป็นความลับ อย่า commit ลง repo
2. สร้างบัญชี Cloudflare และรัน `bunx wrangler login`
3. เปิด R2 ใน Cloudflare dashboard และสร้าง private bucket: `bunx wrangler r2 bucket create metafarm-next-media` (R2 อาจต้องทำขั้นตอน billing และเกินโควตาแล้วอาจมีค่าใช้จ่าย)
4. สร้าง Cloudflare Access Self-hosted application แบบ **public hostname/path** ครอบคลุม hostname ของ Worker ทั้งหมดระหว่างเป็น private staging; เมื่อพร้อมเปิดหน้าเว็บให้คนทั่วไป เอา destination ที่ครอบ hostname ทั้งหมดออกและคง `/admin*` กับ `/api/*` ไว้ อย่าเลือก destination แบบ **Workers** สำหรับเว็บสาธารณะ อนุญาตเฉพาะอีเมลเจ้าของ/ทีมด้วย identity provider ที่ต้องการ และจด Application AUD tag
5. ตั้ง Worker secrets `DATABASE_URL`, `OWNER_EMAIL`, `ACCESS_TEAM_DOMAIN`, `ACCESS_AUD` โดย `ACCESS_TEAM_DOMAIN` เป็น `https://<team>.cloudflareaccess.com` ห้ามตั้ง `DEV_AUTH_EMAIL` บน production คำสั่ง `wrangler secret put` จะ deploy version ทันที ส่วน `wrangler versions secret put` สร้าง version โดยยังไม่ deploy
6. ใน GitHub repo → Settings → Secrets and variables → Actions ตั้ง `NEON_DATABASE_URL`, `CLOUDFLARE_API_TOKEN` และ `CLOUDFLARE_ACCOUNT_ID` (token ให้สิทธิ์ Workers edit และ R2 เฉพาะที่จำเป็น)
7. ไป Actions → **Deploy production** → Run workflow จาก `main` ระบบ migrate schema และ deploy เว็บ/API พร้อมกัน
8. ทดสอบ public `/` โดยไม่ล็อกอิน, `/admin` ผ่าน Access, สร้างรัง/ผลผลิต/บันทึกตรวจ, อัปโหลดรูป, และทดสอบบัญชีที่ไม่มีสิทธิ์ถูกปฏิเสธ

## ข้อจำกัดสำคัญ

- Cloudflare ฟรีมีโควตา Worker ต่อวัน ส่วน R2 ฟรีมีเพดาน และการเปิดใช้งานอาจต้องผูกบัตร ตรวจราคา/โควตาปัจจุบันก่อน production
- Neon Free มีโควตา compute และ storage; เมื่อ idle อาจ scale to zero ทำให้ request แรกช้าขึ้น
- หน้าเว็บผู้ชมเป็น React SPA (static) ขณะนี้ยังอยู่หลัง Access ทั้งหมด; เมื่อเปิดสาธารณะจะใช้งานได้โดยไม่ล็อกอิน แต่ถ้าต้องการ SEO ระดับสูงควรเพิ่ม prerender/SSR ในระยะต่อไป
- รูปใน R2 ไม่เปิด public; อ่านผ่าน API หลังตรวจ Access JWT และ role เท่านั้น
- หน้า public ยังเป็นตัวอย่าง ห้ามเผยแพร่เป็นเว็บไซต์ทางการก่อนแก้ข้อมูลจริง
- ไม่มีการย้ายข้อมูลจากระบบเดิม ต้องวางแผนและทดสอบแยกต่างหาก
- ก่อน migration ที่เปลี่ยน schema ใน production ให้สำรองฐานข้อมูลและมีแผน rollback

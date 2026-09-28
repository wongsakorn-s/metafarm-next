# Deploy บน Free Tier

การ deploy frontend และ Express API จบใน Cloudflare Workers ครั้งเดียว โดยใช้ Neon PostgreSQL เป็นฐานข้อมูลภายนอก หลังเตรียม Neon, R2, Access และ secrets ครั้งแรกแล้ว GitHub Actions `Deploy production` จะตรวจโค้ด → ทดสอบ → migrate PostgreSQL → build → deploy ใน workflow เดียว

## สถานะการเตรียมระบบ (28 กันยายน 2026)

- Neon schema ถูก migrate แล้ว; R2 bucket `metafarm-next-media` ถูกสร้างแล้ว
- สร้าง Neon branch `staging` แบบ schema-only พร้อม migration baseline และ R2 bucket `metafarm-next-media-staging` แล้ว; Worker `metafarm-next-staging` เปิด route ที่ `https://metafarm-next-staging.wong-saengsurasak.workers.dev` และมี secrets `DATABASE_URL`, `OWNER_EMAIL`, `ACCESS_TEAM_DOMAIN`, `ACCESS_AUD` ครบแล้ว
- มี Neon branch `development` แบบ schema-only สำหรับรัน local โดยแยกจาก branch `production`; `.dev.vars` บนเครื่องนี้ชี้ development แล้ว และคำสั่ง local ตรวจ hostname ก่อนใช้ฐานข้อมูล
- Zero Trust Free เปิดใช้งานแล้ว และ Access app `MetaFarm Next admin` ครอบ hostname `metafarm-next.wong-saengsurasak.workers.dev` ทั้งหมด รวมทั้ง `/admin*` และ `/api/*` ด้วยนโยบายอีเมลเจ้าของ
- Worker `metafarm-next` มี secrets `DATABASE_URL`, `OWNER_EMAIL`, `ACCESS_TEAM_DOMAIN`, `ACCESS_AUD` แล้ว เปิด `workers_dev: true` และคง `preview_urls: false` เป็น **private staging** ที่ `https://metafarm-next.wong-saengsurasak.workers.dev` (ต้องผ่าน Access ก่อนเห็นทุกหน้า)
- ตรวจแล้วว่า request ไม่ล็อกอินไปยัง `/`, `/admin`, `/api/me`, `/health` และไฟล์ asset ถูกส่งไปหน้า Access; บัญชีเจ้าของเข้า `/admin`, `/api/me` และ `/api/dashboard` ได้
- หน้าเว็บผู้ชมยังเป็นเนื้อหาตัวอย่าง ต้องยืนยันข้อมูลฟาร์มก่อนเปิดให้คนทั่วไปเข้าชม
- GitHub billing กลับมาใช้งานได้แล้ว: [CI run #2](https://github.com/wongsakorn-s/metafarm-next/actions/runs/36440871524) บน `main` ผ่านครบ (test 8/8) เมื่อ 28 กันยายน 2026
- GitHub Environment `production` ยังต้องตั้ง secrets ของ production แยกต่างหากก่อนใช้ workflow `Deploy production`; ห้ามนำ credentials ของ staging มาใช้แทน
- GitHub Environment `staging` จำกัดให้ deploy จาก branch `main` เท่านั้น (ไม่อนุญาต tag) และมี environment secrets `NEON_DATABASE_URL`, `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` ครบแล้ว
- Cloudflare token `metafarm-next-staging-github-actions` จำกัด `Individual Workers Editor` เฉพาะ Worker `metafarm-next-staging` และหมดอายุ 29 กันยายน 2027
- [Deploy staging #1](https://github.com/wongsakorn-s/metafarm-next/actions/runs/36454418704) ผ่านครบ: typecheck, tests 13/13, ตรวจเป้าหมาย, migrate, build และ deploy commit `c38af8e`; Worker version `73d3e444-c80b-45d3-855f-f85d8e488073`
- Worker เดิม `metafarm-next` ยังใช้ Neon branch `production` และ R2 bucket หลัก จึงห้ามใช้ Worker เดิมทดสอบการเขียนข้อมูลที่เสี่ยงหรือรัน migration ทดลอง; ใช้ Worker `metafarm-next-staging` ที่แยก Neon branch และ R2 bucket แล้ว
- แยก Access app `MetaFarm Next staging` ออกจาก `MetaFarm Next admin` แล้ว เพราะการรวมสอง hostname ใน app เดิมทำให้ callback หลังล็อกอินกลับไป hostname ผิด; app staging ครอบทั้ง hostname โดยใช้ policy `MetaFarm owner` เดิม และ Worker staging ใช้ AUD ใหม่
- ตรวจแล้วว่า request ไม่ล็อกอินไปยัง `/`, `/admin`, `/api/me`, `/health`, `/icon.svg` ถูกส่งไป Access (`302`); บัญชีเจ้าของเปิด `/admin` ได้ และ `/api/me` ตอบ `role: owner`

## แยก staging ให้พร้อมใช้งาน

1. ~~แยก Cloudflare Access app สำหรับ staging และใช้ policy `MetaFarm owner` เดิม~~ — เสร็จแล้ว
2. ~~ตั้ง Worker staging secrets และ AUD ของ app ใหม่ โดยไม่ตั้ง `DEV_AUTH_EMAIL`~~ — เสร็จแล้ว
3. ~~เปิด `workers_dev` และทดสอบ Access/บัญชีเจ้าของ~~ — เสร็จแล้ว
4. ~~จำกัด GitHub Environment `staging` ให้ deploy จาก `main` เท่านั้น ตั้ง environment secrets และรัน workflow `Deploy staging`~~ — เสร็จแล้ว; workflow ตรวจ hostname Neon, Worker name และ R2 bucket อัตโนมัติก่อน migrate/deploy
5. ทดสอบบัญชีทีมงานจริง รวมถึงการอัปโหลด/อ่านรูปใน bucket staging และยืนยันว่าข้อมูล production ไม่เปลี่ยน

Workflow `Deploy production` มีตัวตรวจเป้าหมาย production เช่นกัน แต่ยังไม่ควรรันจนกว่าจะกำหนด production environment/secrets และผ่านการเปิดตัวเว็บสาธารณะตามรายการด้านล่าง

## ผลทดสอบ isolated staging หลัง GitHub Actions deploy

- Deploy staging #1 ผ่านเมื่อ 28 กันยายน 2026; ใช้ Neon branch `staging` และ R2 bucket `metafarm-next-media-staging` ตามตัวตรวจเป้าหมายใน workflow
- หลัง deploy บัญชีเจ้าของเปิดหลังบ้านได้ และเพิ่ม/แก้ไขรัง บันทึกผลผลิต 25 มล./พรอพอลิส 3 กรัม และบันทึกการตรวจผ่าน UI ได้
- Request ไม่ล็อกอินไปยัง `/`, `/admin`, `/api/me`, `/api/dashboard`, `/health`, `/icon.svg` ตอบ `302` ไป Cloudflare Access
- ระหว่างมีข้อมูล QA ใน staging แดชบอร์ด production ยังแสดงรัง/ผลผลิต/การตรวจเป็น 0 ทั้งหมด
- ล้างข้อมูล QA เฉพาะที่สร้างในรอบนี้แล้ว (รัง 1, ผลผลิต 1, การตรวจ 1); ตรวจแดชบอร์ด staging หลังโหลดใหม่กลับเป็น 0 ทั้งหมด และไม่มีไฟล์ QA ถูกอัปโหลดไป R2 ในรอบนี้
- การแนบรูปผ่าน UI ยังติดข้อจำกัด Chrome extension: ต้องเปิด **Allow access to file URLs** ในรายละเอียด extension ChatGPT ก่อนจึงเลือกไฟล์ QA ได้; ยังไม่ถือว่าทดสอบอัปโหลดรูปบน isolated staging ผ่าน
- การทดสอบทีมงานจริงยังต้องมีอีเมลทีมงานที่เจ้าของระบุ และให้บัญชีนั้นล็อกอินผ่าน Access; การทดสอบ role จำลองก่อนหน้านี้ไม่แทนการทดสอบนี้

## วิธี deploy staging ครั้งถัดไป

1. Push โค้ดที่ผ่านการตรวจไป `main`
2. เปิด Actions → **Deploy staging** → **Run workflow** → เลือก `main`
3. รอทุกขั้นตอนสำเร็จ แล้วเปิด URL staging ผ่าน Access เพื่อตรวจฟีเจอร์ที่เปลี่ยน
4. หาก workflow ล้มเหลว ให้แก้สาเหตุจาก step ที่ล้มเหลวก่อนรันใหม่; ห้ามสลับไปใช้ production secrets เพื่อแก้ปัญหา staging

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

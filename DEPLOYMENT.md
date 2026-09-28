# Deploy บน Free Tier

การ deploy frontend และ Express API จบใน Cloudflare Workers ครั้งเดียว โดยใช้ Neon PostgreSQL เป็นฐานข้อมูลภายนอก หลังเตรียม Neon, R2, Access และ secrets ครั้งแรกแล้ว GitHub Actions `Deploy production` จะตรวจโค้ด → ทดสอบ → migrate PostgreSQL → build → deploy ใน workflow เดียว

## สถานะการเตรียมระบบ (28 กันยายน 2026)

- Neon schema ถูก migrate แล้ว; R2 bucket `metafarm-next-media` ถูกสร้างแล้ว
- Zero Trust Free เปิดใช้งานแล้ว และ Access app `MetaFarm Next admin` จำกัด `metafarm-next.wong-saengsurasak.workers.dev/admin*` กับ `/api/*` ด้วยนโยบายอีเมลเจ้าของ
- Worker `metafarm-next` มี secrets `DATABASE_URL`, `OWNER_EMAIL`, `ACCESS_TEAM_DOMAIN`, `ACCESS_AUD` แล้ว แต่ตั้ง `workers_dev: false` และ `preview_urls: false` จึง **ยังไม่มี public URL**
- หน้าเว็บสาธารณะยังเป็นเนื้อหาตัวอย่าง ต้องยืนยันข้อมูลฟาร์มก่อนเปิด route จริง
- GitHub Actions ยังรันไม่ได้เพราะ GitHub แจ้งว่า **บัญชีถูกล็อกด้าน billing** (จึง `startup_failure` ก่อนเริ่ม job ไม่ใช่ปัญหาใน workflow) เจ้าของบัญชีต้องแก้ billing ใน GitHub ก่อนจึงจะใช้ปุ่ม `Deploy production` ได้ ระหว่างนี้ใช้ Wrangler จากเครื่องที่ล็อกอินเพื่อตรวจและ deploy หลังผ่านรายการด้านล่าง

## เปิด public URL เมื่อพร้อม

1. แทนข้อมูลตัวอย่างบนหน้าเว็บด้วยข้อมูลฟาร์มที่ยืนยันแล้ว และตรวจว่ารูป/ข้อความที่เผยแพร่ได้ไม่มีข้อมูลส่วนตัว
2. ตรวจ Access app ว่ายังครอบ `/admin*` และ `/api/*` เฉพาะ hostname ที่จะเปิดใช้งาน หากเพิ่ม custom domain ต้องเพิ่ม hostname ใหม่ใน Access ด้วย
3. ทดสอบ `bun run check`, `bun run test`, `bun run build` และตรวจ migration/backups ของ Neon
4. เปลี่ยน `workers_dev` เป็น `true` ใน `wrangler.jsonc` (คง `preview_urls: false`) แล้วรัน `bunx wrangler deploy` หนึ่งครั้งเพื่อเปิด URL `https://metafarm-next.wong-saengsurasak.workers.dev`
5. ทดสอบ `/` แบบไม่ล็อกอิน, `/admin` แบบล็อกอิน, `/api/me` ทั้งบัญชีที่อนุญาตและไม่อนุญาต, CRUD และอัปโหลด/อ่านรูป R2 จริง ก่อนประกาศ URL ให้ผู้ชม

## เตรียมครั้งแรก

1. สร้างโปรเจกต์ Neon Free และคัดลอก PostgreSQL connection string แบบ `sslmode=require` เก็บเป็นความลับ อย่า commit ลง repo
2. สร้างบัญชี Cloudflare และรัน `bunx wrangler login`
3. เปิด R2 ใน Cloudflare dashboard และสร้าง private bucket: `bunx wrangler r2 bucket create metafarm-next-media` (R2 อาจต้องทำขั้นตอน billing และเกินโควตาแล้วอาจมีค่าใช้จ่าย)
4. สร้าง Cloudflare Access Self-hosted application แบบ **public hostname/path** ครอบคลุม hostname ของ Worker ที่ path `/admin*` และ `/api/*` อย่าเลือก destination แบบ **Workers** ที่จะป้องกันทั้ง Worker และทำให้หน้าเว็บสาธารณะต้องล็อกอิน อนุญาตเฉพาะอีเมลเจ้าของ/ทีมด้วย identity provider ที่ต้องการ และจด Application AUD tag
5. ตั้ง Worker secrets `DATABASE_URL`, `OWNER_EMAIL`, `ACCESS_TEAM_DOMAIN`, `ACCESS_AUD` โดย `ACCESS_TEAM_DOMAIN` เป็น `https://<team>.cloudflareaccess.com` ห้ามตั้ง `DEV_AUTH_EMAIL` บน production คำสั่ง `wrangler secret put` จะ deploy version ทันที ส่วน `wrangler versions secret put` สร้าง version โดยยังไม่ deploy
6. ใน GitHub repo → Settings → Secrets and variables → Actions ตั้ง `NEON_DATABASE_URL`, `CLOUDFLARE_API_TOKEN` และ `CLOUDFLARE_ACCOUNT_ID` (token ให้สิทธิ์ Workers edit และ R2 เฉพาะที่จำเป็น)
7. ไป Actions → **Deploy production** → Run workflow จาก `main` ระบบ migrate schema และ deploy เว็บ/API พร้อมกัน
8. ทดสอบ public `/` โดยไม่ล็อกอิน, `/admin` ผ่าน Access, สร้างรัง/ผลผลิต/บันทึกตรวจ, อัปโหลดรูป, และทดสอบบัญชีที่ไม่มีสิทธิ์ถูกปฏิเสธ

## ข้อจำกัดสำคัญ

- Cloudflare ฟรีมีโควตา Worker ต่อวัน ส่วน R2 ฟรีมีเพดาน และการเปิดใช้งานอาจต้องผูกบัตร ตรวจราคา/โควตาปัจจุบันก่อน production
- Neon Free มีโควตา compute และ storage; เมื่อ idle อาจ scale to zero ทำให้ request แรกช้าขึ้น
- เว็บสาธารณะเป็น React SPA (static) ใช้งานได้โดยไม่ล็อกอิน แต่ถ้าต้องการ SEO ระดับสูงควรเพิ่ม prerender/SSR ในระยะต่อไป
- รูปใน R2 ไม่เปิด public; อ่านผ่าน API หลังตรวจ Access JWT และ role เท่านั้น
- หน้า public ยังเป็นตัวอย่าง ห้ามเผยแพร่เป็นเว็บไซต์ทางการก่อนแก้ข้อมูลจริง
- ไม่มีการย้ายข้อมูลจากระบบเดิม ต้องวางแผนและทดสอบแยกต่างหาก
- ก่อน migration ที่เปลี่ยน schema ใน production ให้สำรองฐานข้อมูลและมีแผน rollback

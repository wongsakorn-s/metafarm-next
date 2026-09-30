# MetaFarm Next: สถานะเทียบระบบเดิมและแผนส่งมอบ

อัปเดต 30 กันยายน 2026 คำว่า “ผ่าน” ระบุระดับที่ตรวจจริง แยก unit test, Neon development และ staging; ยังไม่มีการตรวจ production

## ขอบเขตที่ตกลง

- หน้าเว็บสาธารณะเปิดอ่านได้โดยไม่ต้องล็อกอิน หลังบ้านสำหรับ owner และ staff เท่านั้น
- เจ้าของอนุมัติย้ายข้อมูลจาก `metafarm-management-app` แต่ยังห้ามต่อหรืออ่าน production database/bucket; การย้ายต้องเริ่มจาก export ที่เจ้าของจัดเตรียม หรือสำเนา development ที่ผ่านการตรวจ
- เบอร์โทร อีเมล LINE, Facebook และแผนที่ยังไม่เผยแพร่; หน้า สินค้า/อบรม/สมุดพกยัง unpublished จนกว่าจะมีข้อมูลจริง
- ไม่มีระบบขายสินค้า และไม่มี offline write queue
- การแก้ไข/ลบผลผลิตและการตรวจ: staff แก้ไขรายการของตัวเองได้ภายใน 24 ชั่วโมง; owner แก้ไขและลบได้ทุกรายการ
- เจ้าของเปลี่ยนกติกาการลบรังเป็นเก็บถาวร/กู้คืนใน Phase 2; ยังไม่มีการลบรูป R2 เมื่อ soft delete

## สิ่งที่เพิ่มแล้วในรอบนี้

| ความสามารถ | สถานะ | หลักฐาน/ข้อจำกัด |
| --- | --- | --- |
| สรุปรังตามสถานะ ยอดผลผลิตเดือนนี้ และยอดสะสมทั้งหมด | ผ่านใน development | ยอดรวมคำนวณในฐานข้อมูล ไม่จำกัดตาม 100 รายการที่ส่งมาแสดง |
| ค้นหาและกรองรัง | ผ่านชุดทดสอบ/ตรวจโค้ด | ค้นหาในรายการรังที่โหลดมา; ยังไม่มี server-side pagination |
| รายละเอียดรังพร้อมยอดรวมและประวัติ | ผ่านใน development | แสดง 100 รายการแรกและโหลดเพิ่มได้; ยอดรวมมาจากข้อมูลทั้งหมด |
| โหลดประวัติผลผลิต/การตรวจเพิ่มเติม | ผ่านใน development | แบ่งหน้า 50 รายการต่อครั้ง; ควรเปลี่ยนเป็น cursor หากปริมาณข้อมูลหรือการเขียนพร้อมกันสูงขึ้น |
| แก้ไข/ลบผลผลิตย้อนหลัง | ผ่าน unit test และ smoke test บน Neon development | เพิ่มผู้สร้างรายการ; staff แก้ไขรายการของตัวเองภายใน 24 ชม.; owner แก้ไข/ลบได้ทุกรายการ; ยังไม่ตรวจบน staging |
| สภาพอากาศปัจจุบันในหลังบ้าน | ผ่าน unit test และ local development (ตรวจกรณีไม่มี key) | ใช้ OpenWeather ตามระบบเดิม, cache 5 นาทีและใช้ข้อมูลจริงล่าสุดเมื่อ upstream ล่ม; ยังไม่มี API key บน staging จึงยังไม่ตรวจข้อมูลสด |
| กรองประวัติตามช่วงวันที่ | ผ่านใน development | ใช้วันเริ่ม/สิ้นสุดกับ API และแบ่งหน้าภายใต้ตัวกรองเดียวกัน |
| ส่งออก JSON ข้อมูลตารางสำหรับ owner | ผ่านใน development | รวม audit และ photo manifest แต่ไม่รวม binary รูป; สูงสุด 10,000 รายการต่อประเภท |
| การตรวจรังพร้อมเปลี่ยนสถานะ หรือคงสถานะเดิม | ผ่าน smoke test | การอัปเดตสถานะและสร้างบันทึกอยู่ใน SQL statement เดียว |
| ป้าย QR และสแกนกล้อง | unit + Playwright mock API | ป้ายใหม่เก็บ URL บน origin เดียวกันและสแกนป้ายเก่าแบบรหัสได้; ยังต้องทดสอบกล้อง/เครื่องพิมพ์บนอุปกรณ์จริง |
| ย่อภาพถ่ายก่อนอัปโหลด | ผ่าน unit test | ต้นฉบับสูงสุด 10 MB; ส่ง JPEG สูงสุด 2 MB; ต้องทดสอบภาพจากกล้องจริง |
| ตรวจชนิดภาพจาก signature ฝั่ง API | ผ่าน unit test | ตรวจชนิดไฟล์ ไม่ได้แทนการ decode ภาพเต็มรูปแบบ |
| สุขภาพ API และ request ID/log | ผ่าน local check | `/health/ready` ทดสอบการเชื่อมฐานข้อมูลจริง |
| เนื้อหาชันโรงหน้าสาธารณะที่ขาด | เพิ่มแล้ว | ยังต้องตรวจภาพและข้อความกับเจ้าของฟาร์ม |

## งานต่อก่อนปล่อยจริง

1. กติกาแก้ไข/ลบการตรวจย้อนหลังและสิทธิ์ owner/staff ผ่าน unit test กับ Neon development แล้ว; ยังต้องทดสอบบัญชีจริงบน staging
2. Archive/restore รัง owner-only ผ่าน Neon development แล้ว; ยังต้องตรวจบน staging และตัดสินใจนโยบายเก็บไฟล์รูปเก่าหลังเปลี่ยนรูป
3. ตรวจ repo เก่าเพื่อย้าย endpoint/รูปแบบข้อมูลอากาศ และเพิ่มข้อมูลจริงพร้อม fallback ที่ไม่แสดงข้อมูลปลอม
4. เตรียมตัวนำเข้าข้อมูลแบบ dry-run จาก export ที่ไม่ใช่ production; ตรวจ mapping/จำนวน/รูปก่อนนำเข้า Neon development และ staging
5. สำรอง/กู้คืน JSON, CSV, audit และไฟล์รูปมีสคริปต์แล้ว; ค้างทดสอบวงจรจริงจนกว่าจะมี development R2 bucket/S3 credentials ที่จำกัดขอบเขต; ประเมิน cursor pagination เมื่อข้อมูลมากหรือเขียนพร้อมกันบ่อย
6. เพิ่ม E2E บน staging สำหรับ owner/staff, การเพิ่ม/แก้ไข/ลบข้อมูล, อัปโหลดรูป, ปิดสิทธิ์ทีม และลิงก์รายละเอียดจาก QR โดยใช้ข้อมูลทดสอบที่ลบได้
7. ทดสอบบนมือถือจริง: กล้อง QR, รูปจากกล้อง, สิทธิ์กล้อง, สัญญาณอ่อน, การพิมพ์ A4 และขนาดจอ 320–1440 px
8. ตรวจเนื้อหาสาธารณะกับเจ้าของฟาร์ม ใช้รูปเดิมไปก่อน และปล่อยสินค้า/อบรม/สมุดพกกับช่องทางติดต่อเมื่อยืนยันเนื้อหาจริง; วัด Lighthouse Mobile
9. หลังรีวิวและ staging QA ครบ จึงเตรียมขั้นตอน release แยก พร้อม rollback; production deploy ยังถูกห้ามในงานนี้

## สิ่งที่ทำใน Phase 1 (30 กันยายน 2026)

- เพิ่ม `harvests.created_by_email` แบบ nullable เพื่อให้ migration เข้ากับข้อมูลเดิม; ข้อมูลเดิมที่ไม่มีผู้สร้าง staff แก้ไขไม่ได้ แต่ owner แก้ไข/ลบได้
- เพิ่ม PATCH/DELETE ผลผลิต; PATCH ตรวจสิทธิ์ซ้ำใน backend และเงื่อนไข SQL, DELETE จำกัด owner
- เพิ่มฟอร์มแก้ไขและปุ่มลบพร้อม confirm dialog ในรายการผลผลิต
- ตรวจระดับ unit test และ Neon development เท่านั้น; ยังไม่ deploy/ตรวจ staging
- Rollback: deploy โค้ดก่อนหน้า แล้วค่อยใช้ `ALTER TABLE harvests DROP COLUMN created_by_email` หากต้องการย้อน schema; ค่านี้ลบข้อมูลผู้สร้างที่บันทึกใหม่ทั้งหมด จึงควรเก็บ column ไว้หากจะรักษาประวัติ audit

## สิ่งที่ทำใน Phase 2 (30 กันยายน 2026)

- เพิ่ม `GET /api/weather/current` สำหรับ owner/staff โดยเรียก OpenWeather ด้วยพิกัดที่ใช้ในระบบเดิม
- ตรวจรูปแบบ response จากผู้ให้บริการด้วย Zod, จำกัดเวลารอ 8 วินาที, cache 5 นาที และแสดงข้อมูลจริงล่าสุดเมื่อ upstream ล่ม; ไม่มี mock weather
- เพิ่ม weather card ใน dashboard พร้อม loading/error/retry และป้ายกำกับเมื่อแสดง cache เก่า
- ผ่าน unit test และ smoke test local สำหรับกรณีไม่มี key; ไม่มีการเรียก OpenWeather จริงและยังไม่ได้ตั้ง secret/deploy staging
- ไม่มี schema change ใน Phase นี้

## ขอบเขตที่ยังไม่ทำ

- ยังไม่ย้ายข้อมูลจากระบบเก่า ไม่เพิ่ม role viewer และไม่เปิด production
- รูปหน้า public ยังคงใช้ไฟล์เดิม

การนำเข้าจาก production ของระบบเก่าต้องใช้ไฟล์ export ที่เจ้าของจัดเตรียมไว้ เนื่องจากห้าม agent เชื่อมต่อหรืออ่าน production database/bucket

## Phase 1: Stabilize (ข้อกำหนดล่าสุด)

- แก้ focus trap ของ Sheet ไม่ให้เริ่มใหม่เมื่อ re-render; คืน focus ให้ปุ่ม submit หลังบันทึกล้มเหลว และปิด Sheet เมื่อแก้ไขรังสำเร็จ
- ปรับ Toast/Sheet สำหรับ safe area, ตรวจไฟล์รูปก่อนส่ง, แปลข้อผิดพลาดเครือข่าย/สิทธิ์/HTML เป็นภาษาไทย และจัดลำดับปุ่มบนหน้ารายละเอียดรัง
- ผ่าน unit test และ Playwright ที่ mock API; ตรวจ horizontal overflow ทุกหน้า admin ที่ 320, 360, 768, 1024, 1440 px
- ยังไม่ได้ทดสอบกับ API หรืออุปกรณ์จริงระดับ staging; ไม่มี schema change และไม่แตะ production

## Phase 2: Data Management (ข้อกำหนดล่าสุด)

| ความสามารถ | ระดับที่ผ่าน | ข้อจำกัด |
| --- | --- | --- |
| Migration เพิ่ม archived_at, ผู้สร้าง/ผู้แก้ไข/soft delete และ audit_logs | Neon development | ยังไม่รันบน staging/production |
| สร้าง/แก้ไข/ลบแบบ soft delete ของผลผลิตและการตรวจ พร้อม audit | unit + smoke บน Neon development | staff ยังไม่ได้ทดสอบด้วยบัญชีจริงบน staging |
| Archive/restore รังและปฏิเสธบันทึกใหม่ด้วย 409 | smoke บน Neon development | ข้อมูลเดิมยังคงอยู่และรวมในยอดสะสม |
| สิทธิ์ปุ่มจาก server, ConfirmDialog, ตัวกรองรังเก็บถาวร, ประวัติการแก้ไข | Playwright mock API | ยังไม่ได้ทดสอบ UI กับ API staging จริง |
| ตัวกรองวันที่ไม่หายหลังบันทึก | Playwright mock API | ยังไม่ได้ตรวจการอัปเดตพร้อมกันหลายผู้ใช้ |

- การแก้สถานะในบันทึกตรวจย้อนหลังเปลี่ยนเฉพาะบันทึกนั้นตามคำตัดสินใจเจ้าของ ไม่เปลี่ยนสถานะปัจจุบันของรัง
- Migration `0002_living_sleepwalker.sql` เพิ่มคอลัมน์ nullable และตารางใหม่โดยไม่แก้ migration เก่า; `harvests.created_by_email` เดิมยังอยู่และถูกใช้เป็น fallback เพื่อรักษาสิทธิ์ของข้อมูลเก่า
- `neon-http` ไม่รองรับ callback transaction; mutation พร้อม audit จึงใช้ CTE ใน SQL statement เดียวกัน การอัปโหลด R2 เป็น side effect ภายนอกฐานข้อมูลและลบไฟล์ใหม่ที่เพิ่งอัปโหลดหาก DB ล้มเหลว
- การลบประวัติไม่ลบไฟล์ R2; การเปลี่ยนรูปเก็บไฟล์เก่าที่ไม่ได้อ้างอิงไว้ก่อน เพราะยังไม่มีนโยบายลบถาวรที่อนุมัติ
- Rollback ที่ปลอดภัย: คง schema แบบขยายไว้ แล้ว deploy โค้ดแก้เฉพาะจุด เพราะโค้ดรุ่นเก่าไม่กรอง `deleted_at` และอาจทำให้รายการที่ลบกลับมาปรากฏ ห้าม drop คอลัมน์หรือตาราง audit อัตโนมัติ; การย้อน schema ต้องสำรองข้อมูลและยอมรับว่าประวัติ audit/ข้อมูลผู้แก้ไขจะสูญหาย

## Phase 3: Field Workflow (ข้อกำหนดล่าสุด)

| ความสามารถ | ระดับที่ผ่าน | ข้อจำกัด |
| --- | --- | --- |
| QR เป็น URL ภายในและรองรับรหัสป้ายเก่า | unit + Playwright mock API | ยังไม่สแกนด้วยกล้องมือถือจริง |
| เลือกรังพิมพ์ป้าย A4 3×8 | Playwright print media/PDF | ยังไม่ตรวจ print preview/ขนาดบนเครื่องพิมพ์จริง |
| เปิดบันทึกตรวจจากหน้ารังใน Sheet และอยู่หน้าเดิม | Playwright mock API | ยังไม่ตรวจบน staging |
| Idempotency-Key ป้องกันสร้างผลผลิต/บันทึกตรวจซ้ำ | unit + smoke Neon development + Playwright mock API | ยังไม่ทดสอบ retry ด้วยเครือข่ายมือถือจริง |
| Draft ต่อผู้ใช้/รังและแจ้ง offline | Playwright mock API | draft ไม่รวมรูปและไม่มี offline write queue ตามขอบเขต |
| Progress รูปและปุ่มลองอัปโหลดซ้ำ | Playwright mock API | ถ้าปิดแท็บหลังบันทึกตรวจแต่ก่อนอัปโหลดรูปซ้ำ ไฟล์รูปจะไม่อยู่ใน draft |

- Migration `0003_cool_inhumans.sql` เพิ่ม `idempotency_keys` แบบ backward compatible; ใช้ CTE statement เดียวกับ create/audit เพื่อกันข้อมูลซ้ำ และลบ key ที่เก่ากว่า 24 ชั่วโมงก่อนคำขอสร้างใหม่
- Rollback ที่ปลอดภัย: deploy โค้ดเดิมโดยคงตาราง `idempotency_keys` ไว้; การ drop ตารางจะทำให้คำขอ retry ที่ค้างอยู่สูญเสียการป้องกันข้อมูลซ้ำ จึงต้องรอพ้น 24 ชั่วโมงและสำรองก่อนหากจะลบจริง
- ผลการทดสอบอุปกรณ์ที่ยังค้างระบุใน `docs/field-device-testing.md`; **ยังไม่ผ่านระดับ staging หรือ production**

## Phase 4: Public Site (ข้อกำหนดล่าสุด)

| ความสามารถ | ระดับที่ผ่าน | ข้อจำกัด |
| --- | --- | --- |
| เนื้อหาฟาร์มและสถานะเผยแพร่แยกใน `src/content` | unit + Playwright | สินค้า/อบรม/สมุดพกยัง unpublished จนเจ้าของยืนยันเนื้อหา |
| หน้าแรกซ่อน section อบรมและหน้าเผยแพร่ไม่มี placeholder | unit + Playwright | ยังต้องให้เจ้าของตรวจความถูกต้องของเนื้อหาเดิม |
| ช่องทางติดต่อแสดงเฉพาะค่าที่ยืนยัน | unit + ตรวจโค้ด | เบอร์ อีเมล LINE Facebook และแผนที่ยังไม่มี จึงไม่แสดง |
| รูป AVIF/WebP responsive, ฟอนต์ self-host, วิดีโอ 1.45 MB | build + Lighthouse local | รูปต้นฉบับมีความละเอียดเพียง 396×277 และ 351×279; วิดีโอต้นฉบับ 960×544 ต่ำกว่า 720p ไม่อัปสเกลเทียม |
| HTML prerender, canonical, OG, sitemap, robots, noindex | local Worker + Lighthouse | production hostname ยังถูก Access ครอบทั้งไซต์; crawler ภายนอกยังเข้าไม่ได้ |
| Core Web Vitals และคะแนน Lighthouse Mobile | local Worker | ผลทั้ง 4 หน้าอยู่ใน `docs/lighthouse-local-2026-09-30.md`; ยังไม่ได้วัดบน staging/production |

- ไม่มี migration ใน Phase นี้
- วิดีโอต้นฉบับย้ายไป `assets/source-videos/` เพื่อเก็บคืนได้แต่ไม่ส่งไปกับ static assets; PWA ยังลงทะเบียนได้ แต่ปิด offline navigation fallback เพราะ HTML แต่ละ public route prerender แยกและไม่มี offline read requirement

## Phase 5: Backup & Restore (ข้อกำหนดล่าสุด)

| ความสามารถ | ระดับที่ผ่าน | ข้อจำกัด |
| --- | --- | --- |
| Export JSON ของข้อมูลพร้อม audit และ photo manifest | unit + smoke local (Neon development) | ไม่มีรูปจริงใน export JSON |
| CSV แยกไฟล์ต่อประเภทและรวม ZIP พร้อม UTF-8 BOM | unit + Playwright mock API | ยังไม่ได้ลองเปิดใน Microsoft Excel จริง |
| คำนวณ/ตรวจ SHA-256; R2 upload ใหม่เก็บ hash metadata และ export รองรับรูปเก่าด้วยการอ่าน R2 | unit + smoke ที่ไม่มีรูป | R2 development ของจริงยังไม่ได้ทดสอบ |
| `backup.ts`, `restore.ts --dry-run/--apply` จำกัด Neon development และ bucket `metafarm-next-media-dev` | TypeScript + unit สำหรับ manifest/checksum + code review | ยังไม่ผ่านวงจร backup → restore เพราะเครื่องยังไม่มี S3 credentials และ bucket development; ไม่เขียน staging/production |

- manifest ระบุจำนวนรัง ผลผลิต ตรวจ ทีม audit และรูป; restore ตรวจ checksum ไฟล์ JSON และรูปก่อนเริ่มเขียน, ปฏิเสธฐานข้อมูลที่ไม่ว่าง, ตรวจภาพหลังอัปโหลดกลับ และเทียบจำนวนหลัง restore
- หากการ restore จริงล้มเหลวหลังเริ่มเขียน ต้องสร้าง development branch/bucket ใหม่; script ไม่พยายามลบหรือเขียนทับข้อมูลที่มีอยู่
- ไม่มี migration ใน Phase นี้


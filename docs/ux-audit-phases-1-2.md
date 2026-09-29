# MetaFarm UX audit — Phase 1 และ 2

## Phase 1: ปัญหาที่พบ

| ปัญหา                                            | หน้า/Section      | Severity | แนวทางแก้และผลลัพธ์                                                                            |
| ------------------------------------------------ | ----------------- | -------- | ---------------------------------------------------------------------------------------------- |
| ตารางผลผลิต `min-w-130` ต้องเลื่อนแนวนอนบนมือถือ | Admin / ผลผลิต    | High     | แสดงรายการเป็นการ์ดบนมือถือ และคงตารางสำหรับ `md` ขึ้นไป                                       |
| แท็บ `flex-wrap` แตกเป็นหลายแถวบนจอแคบ           | Admin / เมนู      | High     | เมนูมือถือแบบ fixed bottom 3–4 ช่อง มีชื่อสั้นและพื้นที่สัมผัสอย่างน้อย 56px                   |
| ฟอร์มยาวอยู่ก่อนรายการ                           | Admin ทุก Section | High     | แสดงรายการก่อนบนมือถือ; ปุ่มเพิ่มรายการอยู่เหนือ bottom nav; ฟอร์มเปิดใน Sheet                 |
| การตรวจรังและถ่ายรูปหน้างานหลายขั้น              | Admin / การตรวจ   | High     | ช่องเลือกภาพเปิดกล้องหลัง, แสดง preview, ปุ่มบันทึกเต็มความกว้าง; ยังต้องออนไลน์และรอการยืนยัน |
| ข้อความยืนยันอยู่ใน flow ด้านบน อาจหลุดจากสายตา  | Admin ทุก Section | Medium   | Toast บนจอ พร้อม `role=status/alert`, error ไม่หายเอง                                          |
| ขาด skeleton และ empty state ที่สม่ำเสมอ         | Admin ทุก Section | Medium   | ใช้ Skeleton, EmptyState และปุ่ม retry กลางระบบ                                                |
| ข้อความขาวบน amber-500 contrast ไม่ผ่าน          | ปุ่มหลัก          | High     | เปลี่ยนเป็น stone-950 บน honey-500 (คำนวณ contrast 8.14:1)                                     |
| สถานะรังพึ่งสีอย่างเดียว                         | รัง / การตรวจ     | Medium   | StatusBadge แสดง icon + label + สีแยก 4 สถานะ                                                  |
| ฟอนต์ Thai ระบุชื่อแต่ไม่โหลด                    | ทุกหน้า           | Medium   | เพิ่ม Google Fonts stylesheet พร้อม `display=swap` และ fallback                                |
| หัวข้อ line-height สั้นเกินสำหรับสระไทย          | Public            | Medium   | ใช้ typography token line-height 1.3, body 1.7 และ `line-break: strict`                        |

## Design system

- Tailwind CSS 4 `@theme` อยู่ใน `src/styles.css`: honey, leaf, stone, semantic, hive status, radius, shadow และ typography
- ใช้ breakpoint มาตรฐานของ Tailwind: `sm` 640px, `md` 768px, `lg` 1024px, `xl` 1280px
- สีปุ่มหลัก honey-500 + stone-950; ปุ่มรอง leaf-800 + white
- สีสถานะรัง Strong/Normal/Weak/Empty มี contrast ตัวอักษรมากกว่า 4.5:1 และมี icon/label เสมอ
- ไม่มี dependency เพิ่ม

## Phase 1: โครงสร้างที่ปรับ

| ไฟล์/ส่วน        | เดิม                                      | ใหม่                                                                          | เหตุผล                                            |
| ---------------- | ----------------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------- |
| `src/styles.css` | คลาสเฉพาะกิจและสี hex กระจาย              | `@theme` tokens, base styles, focus/reduced-motion                            | คุมความสม่ำเสมอและ contrast จากที่เดียว           |
| `AdminPage.tsx`  | UI, ฟอร์ม, รายการ และ API อยู่ในไฟล์เดียว | เหลือ state และ API orchestration; UI แยกเป็น feature components              | แก้หน้าจอได้โดยไม่แตะ business logic              |
| `components/ui`  | markup ของปุ่ม/ช่องกรอก/สถานะซ้ำ          | Button, Input, Select, Field, Card, Badge, Toast, EmptyState, Skeleton, Sheet | ใช้ interaction และ accessibility pattern ร่วมกัน |
| `features/*`     | 4 sections รวมในหน้า Admin                | List/Form/Card/PhotoUpload แยกตามโดเมน                                        | ดูแลและทดสอบรายส่วนง่าย                           |
| `i18n/th.ts`     | ข้อความไทยฝังใน JSX                       | key-value กลางสำหรับข้อความ UI                                                | ลดข้อความซ้ำและเตรียมพร้อมแก้เนื้อหา              |
| `index.html`     | ระบุฟอนต์ใน CSS แต่ไม่ได้โหลด             | โหลดฟอนต์ไทยพร้อม `display=swap`                                              | ลดปัญหาการแสดงผลตัวอักษรไทย                       |

## Phase 2: การเปลี่ยนแปลง Public

| ไฟล์/ส่วน                    | เดิม                                | ใหม่                                                                       | เหตุผล                            |
| ---------------------------- | ----------------------------------- | -------------------------------------------------------------------------- | --------------------------------- |
| `PublicPage.tsx`             | Layout และทุกหน้าในไฟล์เดียว        | เลือกหน้าตาม pathname และตั้ง title/meta description                       | แยกความรับผิดชอบ                  |
| `PublicLayout.tsx`           | เมนูมือถือขนาดเล็ก                  | full-screen Sheet, Esc/backdrop, scroll lock, focus trap                   | ใช้มือถือได้ง่ายและเข้าถึงได้     |
| Footer                       | ข้อมูลน้อยและลิงก์ไม่ครบ            | ข้อมูลฟาร์ม ลิงก์ทุกหน้าจาก `publicRoutes` และสถานะ social                 | ให้ผู้ใช้หาทางติดต่อได้           |
| Home                         | เนื้อหาอยู่การ์ดเดียว               | Hero → Stats → ชันโรง → น้ำผึ้ง → อบรม → ติดต่อ                            | สื่อความน่าเชื่อถือและเส้นทาง CTA |
| StinglessBee                 | รวมในไฟล์ใหญ่                       | หน้าเฉพาะพร้อมภาพ สถิติ ข้อมูล และ CTA                                     | อ่านบนมือถือได้ง่าย               |
| Honey / Contact / ComingSoon | รวมในไฟล์ใหญ่                       | หน้าเฉพาะและใช้ component/token ร่วมกัน                                    | ดูแลรักษาง่าย                     |
| Media                        | รูปไม่มีมิติและวิดีโอ autoplay เสมอ | ใส่ width/height, poster, lazy loading; เคารพ reduced-motion และ Save-Data | ลด CLS และประหยัดข้อมูล           |

## ขอบเขตและสิ่งที่ต้องวัดต่อ

- โค้ด backend, API endpoint, schema และ business logic การบันทึกไม่เปลี่ยน
- ไม่มี offline write queue: ถ้าสัญญาณหายระหว่างบันทึก ผู้ใช้ต้อง retry เอง
- รูป PNG เดิมขนาดประมาณ 147–150 KB ต่อภาพ ควรแปลงเป็น WebP/AVIF เมื่อมี asset pipeline ที่ตรวจคุณภาพภาพได้
- วิดีโอเดิมขนาดประมาณ 3.2 MB; Lighthouse Mobile 90/95 เป็น **เป้าหมาย** ยังไม่ใช่ผลที่วัดได้
- PWA และ scripts เดิมคงอยู่

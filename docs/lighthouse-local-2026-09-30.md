# Lighthouse Mobile — Worker ในเครื่อง

วัดวันที่ 30 กันยายน 2026 บน `http://127.0.0.1:8787` หลัง build/prerender โดยใช้ Lighthouse CLI mobile default throttling และ Chrome headless คะแนนเป็นผลของ **development/local Worker** ไม่ใช่ staging หรือ production; ควรวัดซ้ำบน staging หลังตั้ง Cloudflare Access สำหรับหน้า public

| หน้า | Performance | Accessibility | Best Practices | SEO | LCP | CLS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| `/` | 96 | 100 | 100 | 100 | 2.461 s | 0.002 |
| `/stingless-bee` | 96 | 100 | 100 | 100 | 2.428 s | 0.002 |
| `/stingless-bee-honey` | 95 | 100 | 100 | 100 | 2.424 s | 0.057 |
| `/contact` | 96 | 100 | 100 | 100 | 2.422 s | 0.001 |

คำสั่งวัด (ต้องมี Chrome และรัน local Worker หลัง `bun run build`):

```powershell
$env:CHROME_PATH='C:\Program Files\Google\Chrome\Application\chrome.exe'
bunx lighthouse http://127.0.0.1:8787/ --chrome-flags='--headless --no-sandbox' --output=json --output-path=local-lighthouse.json --only-categories=performance,accessibility,seo,best-practices --form-factor=mobile
```

หน้า public ยังถูก Cloudflare Access ครอบทั้ง hostname production ตาม `DEPLOYMENT.md`; crawler ภายนอกจึงยังไม่เห็นเนื้อหาแม้ HTML/SEO ผ่านในเครื่อง ต้องแยก Access ให้ป้องกันเฉพาะ `/admin*` และ `/api/*` ก่อนเปิด public จริง โดยไม่ลดการป้องกัน API

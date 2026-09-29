import { expect, test, type Page } from "@playwright/test";
import { th } from "../../src/i18n/th";

const hiveId = "4a5b4ee4-179f-4c52-833d-e96f5f87ebd9";
const hive = {
  id: hiveId,
  code: "MF-E2E-001",
  name: "รังทดสอบ",
  species: "ชันโรงขนเงิน",
  location: "แปลง A",
  status: "Normal",
};
const dashboard = {
  staff: { email: "owner@example.com", role: "owner" },
  summary: {
    month: "2026-09",
    hiveStatuses: { Strong: 0, Normal: 1, Weak: 0, Empty: 0 },
    hiveCount: 1,
    harvestCount: 1,
    inspectionCount: 1,
    totalHoneyMl: 125,
    totalPropolisG: 3,
    monthlyHarvestCount: 1,
    monthlyHoneyMl: 125,
    monthlyPropolisG: 3,
  },
  hives: [hive],
  harvests: [{
    id: "bec2012a-2808-4c59-a519-e59845768034",
    hiveId,
    harvestedAt: "2026-09-29",
    honeyMl: 125,
    propolisG: 3,
    createdByEmail: "owner@example.com",
    createdAt: "2026-09-29T00:00:00.000Z",
  }],
  inspections: [{
    id: "2d88f6f2-19b3-4f12-8971-484cf7491fe3",
    hiveId,
    inspectedAt: "2026-09-29",
    status: "Normal",
    notes: "ตรวจรังแล้ว",
    imageKey: null,
  }],
  team: [{ email: "owner@example.com", active: true }],
};

async function mockApi(page: Page) {
  await page.route("**/api/**", async (route) => {
    const pathname = new URL(route.request().url()).pathname;
    if (pathname === "/api/dashboard") {
      await route.fulfill({ json: dashboard });
    } else if (pathname === `/api/hives/${hiveId}`) {
      await route.fulfill({ json: {
        hive,
        harvests: dashboard.harvests,
        inspections: dashboard.inspections,
        totals: { harvestCount: 1, honeyMl: 125, propolisG: 3, inspectionCount: 1 },
      } });
    } else {
      await route.fulfill({ status: 404, json: { error: "ไม่พบข้อมูลทดสอบ" } });
    }
  });
}

test("บันทึกรังล้มเหลวแล้ว focus กลับไปปุ่มบันทึกใน Sheet", async ({ page }) => {
  await mockApi(page);
  await page.route(`**/api/hives/${hiveId}`, async (route) => {
    if (route.request().method() === "PATCH")
      await route.fulfill({ status: 500, json: { error: "บันทึกไม่สำเร็จ" } });
    else await route.fallback();
  });
  await page.goto("/admin#hives");
  await page.getByRole("button", { name: th.admin.editData }).click();
  const dialog = page.getByRole("dialog", { name: `${th.admin.editHive} ${hive.code}` });
  const submit = dialog.getByRole("button", { name: th.admin.saveEdit });
  await submit.click();
  await expect(dialog).toBeVisible();
  await expect(submit).toBeFocused();
});

test("แก้ไขรังสำเร็จแล้ว Sheet ปิด", async ({ page }) => {
  await mockApi(page);
  await page.route(`**/api/hives/${hiveId}`, async (route) => {
    if (route.request().method() === "PATCH")
      await route.fulfill({ json: { ...hive, name: "รังใหม่" } });
    else await route.fallback();
  });
  await page.goto("/admin#hives");
  await page.getByRole("button", { name: th.admin.editData }).click();
  const dialog = page.getByRole("dialog", { name: `${th.admin.editHive} ${hive.code}` });
  await dialog.getByRole("button", { name: th.admin.saveEdit }).click();
  await expect(dialog).not.toBeVisible();
});

test("dashboard ตอบ HTML แล้วแจ้ง sessionExpired ภาษาไทย", async ({ page }) => {
  await page.route("**/api/dashboard?*", (route) =>
    route.fulfill({ contentType: "text/html", body: "<html>Cloudflare Access</html>" }),
  );
  await page.goto("/admin");
  await expect(page.getByText(th.common.sessionExpired)).toBeVisible();
  await expect(page.getByText(/Unexpected token/)).toHaveCount(0);
});

test("เลือกไฟล์รูปแบบภาษาไทย ตรวจชนิด และล้างตัวอย่างเมื่อ reset", async ({ page }) => {
  await mockApi(page);
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto("/admin#inspections");
  await page.getByRole("button", { name: /บันทึกการตรวจ/ }).click();
  const dialog = page.getByRole("dialog", { name: th.admin.addInspection });
  await expect(dialog.getByRole("button", { name: th.admin.choosePhoto })).toBeVisible();
  const input = dialog.locator('input[type="file"]');
  await input.setInputFiles({ name: "bad.gif", mimeType: "image/gif", buffer: Buffer.from("not an image") });
  await expect(dialog.getByText(th.common.imageTypeInvalid)).toBeVisible();
  await expect(input).toHaveJSProperty("validationMessage", th.common.imageTypeInvalid);
  await input.setInputFiles({ name: "large.png", mimeType: "image/png", buffer: Buffer.alloc(10_000_001) });
  await expect(dialog.getByText(th.common.imageSourceTooLarge)).toBeVisible();
  await expect(input).toHaveJSProperty("validationMessage", th.common.imageSourceTooLarge);
  await input.setInputFiles({ name: "photo.png", mimeType: "image/png", buffer: Buffer.from("preview") });
  await expect(dialog.getByAltText(th.admin.photoPreview)).toBeVisible();
  await expect(dialog.getByText(/photo\.png/)).toBeVisible();
  await dialog.locator("form").evaluate((form: HTMLFormElement) => form.reset());
  await expect(dialog.getByAltText(th.admin.photoPreview)).toHaveCount(0);
  await expect(dialog.getByText(/photo\.png/)).toHaveCount(0);
});

test("ทุกหน้า admin ไม่มี horizontal overflow", async ({ page }) => {
  await mockApi(page);
  for (const width of [320, 360, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const url of [
      "/admin#hives", "/admin#harvests", "/admin#inspections",
      "/admin#qr", "/admin#team", `/admin/hives/${hiveId}`,
    ]) {
      await page.goto(url);
      await expect(page.getByRole("main")).toBeVisible();
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
    }
  }
});

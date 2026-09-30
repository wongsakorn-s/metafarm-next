import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const hiveId = "4a5b4ee4-179f-4c52-833d-e96f5f87ebd9";

async function mockDashboard(page: Page) {
  await page.route("**/api/**", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === "/api/dashboard") {
      await route.fulfill({ json: {
        staff: { email: "owner@example.com", role: "owner" },
        summary: {
          month: "2026-09", hiveStatuses: { Strong: 0, Normal: 0, Weak: 0, Empty: 0 },
          hiveCount: 0, harvestCount: 0, inspectionCount: 0, totalHoneyMl: 0,
          totalPropolisG: 0, monthlyHarvestCount: 0, monthlyHoneyMl: 0, monthlyPropolisG: 0,
        }, hives: [], harvests: [], inspections: [], team: [],
      } });
    } else if (url.pathname === "/api/hives") {
      await route.fulfill({ json: [] });
    } else if (url.pathname === "/api/harvests" || url.pathname === "/api/inspections") {
      await route.fulfill({ json: { items: [], nextOffset: null } });
    } else if (url.pathname === `/api/hives/${hiveId}`) {
      await route.fulfill({ json: {
        hive: { id: hiveId, code: "AXE-001", name: "รังทดสอบ", species: null, location: null, status: "Normal", archivedAt: null },
        harvests: [], inspections: [],
        totals: { harvestCount: 0, honeyMl: 0, propolisG: 0, inspectionCount: 0 },
      } });
    } else if (url.pathname === "/api/weather/current") {
      await route.fulfill({ status: 503, json: { error: "ไม่มีข้อมูลอากาศ" } });
    } else {
      await route.fulfill({ json: { items: [], nextOffset: null } });
    }
  });
}

async function expectNoSeriousViolations(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  const violations = results.violations.filter((violation) => ["serious", "critical"].includes(violation.impact ?? ""));
  expect(violations, JSON.stringify(violations.map((item) => ({ id: item.id, nodes: item.nodes.map((node) => node.target) })), null, 2)).toEqual([]);
}

test("หน้า public ทุกหน้าผ่าน axe ระดับ serious/critical", async ({ page }) => {
  for (const route of ["/", "/stingless-bee", "/stingless-bee-honey", "/contact"]) {
    await page.goto(route);
    await expect(page.locator("main")).toBeVisible();
    await expectNoSeriousViolations(page);
  }
});

test("หน้าหลังบ้านทุก section ผ่าน axe ระดับ serious/critical", async ({ page }) => {
  await mockDashboard(page);
  for (const section of ["hives", "harvests", "inspections", "qr", "team"]) {
    await page.goto(`/admin#${section}`);
    await expect(page.locator("main")).toBeVisible();
    await expectNoSeriousViolations(page);
  }
  await page.goto(`/admin/hives/${hiveId}`);
  await expectNoSeriousViolations(page);
});

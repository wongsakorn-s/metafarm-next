import { expect, test } from "@playwright/test";
import { th } from "../../src/i18n/th";

test("หน้า Public ที่เผยแพร่ไม่มี placeholder หรือ horizontal overflow", async ({ page }) => {
  for (const width of [320, 375, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ["/", "/stingless-bee", "/stingless-bee-honey", "/contact"]) {
      await page.goto(route);
      await expect(page.locator("main")).toBeVisible();
      await expect(page.getByText(th.public.comingSoon)).toHaveCount(0);
      await expect(page.getByText(th.public.pending)).toHaveCount(0);
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
    }
  }
});

test("หน้าไม่เผยแพร่ไม่อยู่ในเมนูและใช้ noindex", async ({ page }) => {
  await page.goto("/product");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex,nofollow");
  await expect(page.getByRole("navigation", { name: th.public.footerNav }).getByRole("link", { name: th.public.nav.product })).toHaveCount(0);
});

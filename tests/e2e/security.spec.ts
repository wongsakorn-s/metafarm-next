import { expect, test } from "@playwright/test";

test("Cloudflare Worker ส่ง security headers ให้ static และ API", async ({ request }) => {
  test.skip(!process.env.E2E_BASE_URL, "ทดสอบเมื่อรันกับ local Worker เท่านั้น");
  const staticResponse = await request.get("/");
  expect(staticResponse.headers()["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(staticResponse.headers()["strict-transport-security"]).toContain("max-age=31536000");
  expect(staticResponse.headers()["permissions-policy"]).toContain("camera=(self)");
  expect(staticResponse.headers()["x-content-type-options"]).toBe("nosniff");
  const apiResponse = await request.get("/api/me");
  expect(apiResponse.headers()["content-security-policy"]).toContain("default-src 'none'");
  expect(apiResponse.headers()["cache-control"]).toContain("no-store");
  const health = await request.get("/health/ready");
  expect(health.ok()).toBeTruthy();
});

test("หน้า public และหลังบ้านไม่ละเมิด Content Security Policy", async ({ page }) => {
  test.skip(!process.env.E2E_BASE_URL, "ทดสอบเมื่อรันกับ local Worker เท่านั้น");
  const violations: string[] = [];
  page.on("console", (message) => {
    if (message.text().includes("Content Security Policy")) violations.push(message.text());
  });
  await page.addInitScript(() => {
    document.addEventListener("securitypolicyviolation", (event) =>
      console.error(`Content Security Policy: ${event.violatedDirective} ${event.blockedURI}`));
  });
  // Render the weather card with an icon even when the Worker has no OpenWeather key (as in CI),
  // so the icon's image source is checked against img-src.
  await page.route("**/api/weather/current", (route) => route.fulfill({ json: {
    timestamp: new Date().toISOString(), tempC: 30, humidity: 80, locationName: "ฟาร์ม",
    description: "ฝนเบาๆ", icon: "10d", windSpeedMps: 1, cloudinessPct: 50, sourceName: "OpenWeather",
  } }));
  for (const path of ["/", "/stingless-bee", "/stingless-bee-honey", "/contact", "/admin", "/admin#hives", "/admin#qr", "/admin#team"]) {
    await page.goto(path);
    await expect(page.locator("main")).toBeVisible();
    if (path === "/admin") await expect(page.locator('img[src*="openweathermap.org"]')).toBeAttached();
    await page.waitForLoadState("networkidle");
  }
  expect(violations).toEqual([]);
});

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

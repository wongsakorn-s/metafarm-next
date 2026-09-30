import { describe, expect, it } from "vitest";
import { parseScannedQr } from "./qrValue";

const origin = "https://metafarm.example";

describe("QR content validation", () => {
  it("accepts current same-origin URL labels and old raw codes", () => {
    expect(parseScannedQr(`${origin}/admin/qr/MF-001`, origin)).toBe("MF-001");
    expect(parseScannedQr("mf-001", origin)).toBe("MF-001");
  });

  it("rejects external URLs and non-code content", () => {
    expect(parseScannedQr("https://evil.example/admin/qr/MF-001", origin)).toBeNull();
    expect(parseScannedQr(`${origin}/admin/qr/MF-001?next=https://evil.example`, origin)).toBeNull();
    expect(parseScannedQr("javascript:alert(1)", origin)).toBeNull();
    expect(parseScannedQr("../../outside", origin)).toBeNull();
  });
});

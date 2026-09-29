import { afterEach, describe, expect, it, vi } from "vitest";
import { prepareImage } from "./image";

afterEach(() => vi.unstubAllGlobals());

describe("prepareImage", () => {
  it("rejects unsupported files before decoding", async () => {
    const file = new File(["not an image"], "photo.gif", {
      type: "image/gif",
    });
    await expect(prepareImage(file)).rejects.toThrow("JPEG, PNG หรือ WebP");
  });

  it("resizes a camera photo and uploads a JPEG", async () => {
    const close = vi.fn();
    const drawImage = vi.fn();
    vi.stubGlobal("createImageBitmap", async () => ({
      width: 2400,
      height: 1600,
      close,
    }));
    const canvas = {
      width: 0,
      height: 0,
      getContext: () => ({ fillStyle: "", fillRect: vi.fn(), drawImage }),
      toBlob: (callback: (blob: Blob) => void) =>
        callback(new Blob(["compressed"], { type: "image/jpeg" })),
    };
    vi.stubGlobal("document", { createElement: () => canvas });

    const file = new File(["camera photo"], "hive.png", {
      type: "image/png",
    });
    const result = await prepareImage(file);

    expect(result.name).toBe("hive.jpg");
    expect(result.type).toBe("image/jpeg");
    expect(canvas.width).toBe(1200);
    expect(canvas.height).toBe(800);
    expect(drawImage).toHaveBeenCalledOnce();
    expect(close).toHaveBeenCalledOnce();
  });
});

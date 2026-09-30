import { describe, expect, it } from "vitest";
import { strFromU8, unzipSync } from "fflate";
import { csvTable, csvZip } from "./exportCsv";

describe("CSV backup", () => {
  it("quotes commas, quotes and newlines", () => {
    expect(csvTable("hives", [{ code: "MF,001", name: 'รัง "ทดสอบ"\nA' }])).toContain('"MF,001","รัง ""ทดสอบ""\nA"');
  });

  it("writes separate UTF-8 BOM CSV files to zip", () => {
    const files = unzipSync(csvZip({
      hives: [{ code: "รังทดสอบ" }], harvests: [], inspections: [], team: [], audit: [], photos: [],
    }));
    expect(Object.keys(files).sort()).toEqual(["audit.csv", "harvests.csv", "hives.csv", "inspections.csv", "photos.csv", "team.csv"]);
    expect(Array.from(files["hives.csv"].slice(0, 3))).toEqual([0xef, 0xbb, 0xbf]);
    expect(strFromU8(files["hives.csv"])).toMatch(/^id,code,/);
    expect(strFromU8(files["hives.csv"])).toContain("รังทดสอบ");
  });
});

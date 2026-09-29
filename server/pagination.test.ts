import { describe, expect, it } from "vitest";
import { historyQuery, pageResult } from "./pagination";

describe("history pagination", () => {
  it("defaults to a bounded first page", () => {
    expect(historyQuery.parse({})).toEqual({ offset: 0, limit: 50 });
    expect(() => historyQuery.parse({ limit: "101" })).toThrow();
    expect(() => historyQuery.parse({ offset: "-1" })).toThrow();
  });

  it("returns a next offset only when another page exists", () => {
    expect(pageResult([1, 2, 3], 0, 2)).toEqual({
      items: [1, 2],
      nextOffset: 2,
    });
    expect(pageResult([3], 2, 2)).toEqual({ items: [3], nextOffset: null });
  });
});

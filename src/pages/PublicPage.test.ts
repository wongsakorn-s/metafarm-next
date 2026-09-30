import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { PublicPage } from "./PublicPage";
import { th } from "../i18n/th";
import {
  publicNavigationRoutes,
  publicRoutes,
  resolvePublicPath,
} from "./publicRoutes";

describe("public pages migrated from the original app", () => {
  it("keeps every original public route", () => {
    expect(publicRoutes.map((route) => route.path)).toEqual([
      "/",
      "/stingless-bee",
      "/stingless-bee-honey",
      "/product",
      "/training",
      "/pocketbook",
      "/contact",
    ]);
  });

  it("normalizes trailing slashes and handles unknown routes safely", () => {
    expect(resolvePublicPath("/stingless-bee/")).toBe("/stingless-bee");
    expect(resolvePublicPath("/contact")).toBe("/contact");
    expect(resolvePublicPath("/unknown")).toBe("/");
  });

  it("shows only ready pages in navigation", () => {
    expect(publicNavigationRoutes.map((route) => route.path)).toEqual([
      "/",
      "/stingless-bee",
      "/stingless-bee-honey",
      "/contact",
    ]);
  });

  it("does not show unfinished content on published pages", () => {
    for (const route of publicNavigationRoutes) {
      const html = renderToString(createElement(PublicPage, { initialPath: route.path }));
      expect(html).not.toContain(th.public.comingSoon);
      expect(html).not.toContain(th.public.pending);
      expect(html).not.toContain(th.public.trainingIntro);
    }
  });
});

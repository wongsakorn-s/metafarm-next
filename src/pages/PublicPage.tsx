import { useEffect } from "react";
import { PublicLayout } from "../components/layout/PublicLayout";
import { th } from "../i18n/th";
import { ComingSoon } from "./public/ComingSoon";
import { Contact } from "./public/Contact";
import { Home } from "./public/Home";
import { Honey } from "./public/Honey";
import { StinglessBee } from "./public/StinglessBee";
import { publicRoutes, resolvePublicPath } from "./publicRoutes";

const descriptions: Record<string, string> = {
  "/": th.public.homeLead,
  "/stingless-bee": th.public.beeIntro,
  "/stingless-bee-honey": th.public.honeyIntro,
  "/contact": th.public.contactIntro,
};

export function PublicPage({ initialPath }: { initialPath?: string }) {
  const path = resolvePublicPath(initialPath ?? window.location.pathname);
  const title =
    publicRoutes.find((route) => route.path === path)?.label ??
    th.public.nav.home;
  useEffect(() => {
    document.title = `${title} | MetaFarm`;
    document
      .querySelector<HTMLMetaElement>('meta[name="description"]')
      ?.setAttribute("content", descriptions[path] ?? `${title} | MetaFarm`);
    const robots = document.querySelector<HTMLMetaElement>('meta[name="robots"]') ?? document.createElement("meta");
    robots.name = "robots";
    robots.content = publicRoutes.find((route) => route.path === path)?.published ? "index,follow" : "noindex,nofollow";
    if (!robots.isConnected) document.head.appendChild(robots);
  }, [path, title]);

  const page =
    path === "/" ? (
      <Home />
    ) : path === "/stingless-bee" ? (
      <StinglessBee />
    ) : path === "/stingless-bee-honey" ? (
      <Honey />
    ) : path === "/contact" ? (
      <Contact />
    ) : (
      <ComingSoon title={title} />
    );
  return <PublicLayout path={path}>{page}</PublicLayout>;
}

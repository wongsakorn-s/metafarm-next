import { th } from "../i18n/th";
import { unpublishedContent } from "../content/farm";

export const publicRoutes = [
  { path: "/", label: th.public.nav.home, published: true },
  { path: "/stingless-bee", label: th.public.nav.bee, published: true },
  { path: "/stingless-bee-honey", label: th.public.nav.honey, published: true },
  { path: "/product", label: th.public.nav.product, published: unpublishedContent.product },
  { path: "/training", label: th.public.nav.training, published: unpublishedContent.training },
  { path: "/pocketbook", label: th.public.nav.pocketbook, published: unpublishedContent.pocketbook },
  { path: "/contact", label: th.public.nav.contact, published: true },
] as const;

export const publicNavigationRoutes = publicRoutes.filter(
  (route) => route.published,
);

export function resolvePublicPath(pathname: string): string {
  const path = pathname === "/" ? "/" : pathname.replace(/\/+$/, "");
  return publicRoutes.some((route) => route.path === path) ? path : "/";
}

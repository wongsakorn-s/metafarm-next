import { th } from "../i18n/th";

export const publicRoutes = [
  { path: "/", label: th.public.nav.home, published: true },
  { path: "/stingless-bee", label: th.public.nav.bee, published: true },
  { path: "/stingless-bee-honey", label: th.public.nav.honey, published: true },
  { path: "/product", label: th.public.nav.product, published: false },
  { path: "/training", label: th.public.nav.training, published: false },
  { path: "/pocketbook", label: th.public.nav.pocketbook, published: false },
  { path: "/contact", label: th.public.nav.contact, published: true },
] as const;

export const publicNavigationRoutes = publicRoutes.filter(
  (route) => route.published,
);

export function resolvePublicPath(pathname: string): string {
  const path = pathname === "/" ? "/" : pathname.replace(/\/+$/, "");
  return publicRoutes.some((route) => route.path === path) ? path : "/";
}

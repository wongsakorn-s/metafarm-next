import { th } from "../i18n/th";

export const publicRoutes = [
  { path: "/", label: th.public.nav.home },
  { path: "/stingless-bee", label: th.public.nav.bee },
  { path: "/stingless-bee-honey", label: th.public.nav.honey },
  { path: "/product", label: th.public.nav.product },
  { path: "/training", label: th.public.nav.training },
  { path: "/pocketbook", label: th.public.nav.pocketbook },
  { path: "/contact", label: th.public.nav.contact },
] as const;

export function resolvePublicPath(pathname: string): string {
  const path = pathname === "/" ? "/" : pathname.replace(/\/+$/, "");
  return publicRoutes.some((route) => route.path === path) ? path : "/";
}

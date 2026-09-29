// Old bookmarks remain usable, but all protected content stays under /admin.
export function legacyAdminDestination(pathname: string): string | null {
  const path = pathname.replace(/\/+$/, "") || "/";
  if (path === "/login" || path === "/dashboard") return "/admin";
  if (path === "/hives" || /^\/hives\/[^/]+$/.test(path)) return "/admin#hives";
  if (path === "/users") return "/admin#team";
  if (path === "/print-qr") return "/admin#hives";
  return null;
}

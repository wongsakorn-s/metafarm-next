import { useState, type ReactNode } from "react";
import { Button, ButtonLink } from "../ui/Button";
import { Sheet } from "../ui/Sheet";
import { th } from "../../i18n/th";
import { publicNavigationRoutes } from "../../pages/publicRoutes";

export function PublicLayout({
  path,
  children,
}: {
  path: string;
  children: ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <a href="#main-content" className="skip-link">
        {th.common.skip}
      </a>
      <header className="sticky top-0 z-40 border-b border-stone-200 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <a
            href="/"
            aria-label={th.public.logoHome}
            className="shrink-0 rounded-control"
          >
            <img
              src="/logo.png"
              alt="MetaFarm"
              width="500"
              height="196"
              className="h-10 w-auto"
            />
          </a>
          <nav
            aria-label={th.public.mainNav}
            className="hidden items-center gap-1 lg:flex"
          >
            {publicNavigationRoutes.map((item) => (
              <a
                key={item.path}
                href={item.path}
                aria-current={path === item.path ? "page" : undefined}
                className={`inline-flex min-h-11 items-center rounded-control px-3 text-sm font-semibold ${path === item.path ? "bg-leaf-50 text-leaf-800" : "text-stone-700 hover:bg-stone-100"}`}
              >
                {item.label}
              </a>
            ))}
          </nav>
          <div className="hidden lg:block">
            <ButtonLink href="/contact" variant="secondary">
              {th.public.contactAction} <span aria-hidden="true">→</span>
            </ButtonLink>
          </div>
          <Button
            variant="outline"
            className="lg:hidden"
            aria-label={th.public.openMenu}
            aria-controls="public-menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(true)}
          >
            ☰
          </Button>
        </div>
      </header>
      <Sheet
        id="public-menu"
        side="right"
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        title={th.public.menu}
      >
        <nav aria-label={th.public.mobileNav} className="grid gap-1">
          {publicNavigationRoutes.map((item) => (
            <a
              key={item.path}
              href={item.path}
              aria-current={path === item.path ? "page" : undefined}
              className={`flex min-h-12 items-center justify-between rounded-control px-4 py-3 font-semibold ${path === item.path ? "bg-honey-100 text-honey-900" : "text-stone-800 hover:bg-stone-100"}`}
            >
              {item.label}
              <span aria-hidden="true">›</span>
            </a>
          ))}
        </nav>
        <ButtonLink href="/contact" variant="secondary" full className="mt-6">
          {th.public.contactAction} →
        </ButtonLink>
        <a
          href="/admin"
          className="mt-5 flex min-h-11 items-center justify-center text-sm font-semibold text-leaf-800"
        >
          {th.common.login}
        </a>
      </Sheet>
      {children}
      <footer className="mt-20 border-t border-stone-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1fr_1fr] lg:px-8">
          <div>
            <img
              src="/logo.png"
              alt="MetaFarm"
              width="500"
              height="196"
              loading="lazy"
              className="h-12 w-auto"
            />
            <p className="mt-4 font-bold text-leaf-800">{th.public.footer}</p>
            <p className="mt-2 text-sm text-stone-600">{th.public.location}</p>
          </div>
          <div>
            <h2 className="text-base font-bold">{th.public.explore}</h2>
            <nav
              aria-label={th.public.footerNav}
              className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1"
            >
              {publicNavigationRoutes.map((item) => (
                <a
                  key={item.path}
                  href={item.path}
                  className="flex min-h-11 items-center text-sm text-stone-700 hover:text-leaf-800"
                >
                  {item.label}
                </a>
              ))}
            </nav>
            <a
              href="/admin"
              className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-leaf-800"
            >
              {th.common.login}
            </a>
          </div>
        </div>
        <div className="border-t border-stone-200 px-4 py-5 text-center text-xs text-stone-600">
          © {new Date().getFullYear()} MetaFarm. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

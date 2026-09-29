import type { ReactNode } from "react";
import { th } from "../../i18n/th";

export type AdminSection = "hives" | "harvests" | "inspections" | "team";
const sections: {
  id: AdminSection;
  label: string;
  mobileLabel: string;
  icon: string;
}[] = [
  {
    id: "hives",
    label: th.admin.hives,
    mobileLabel: th.admin.hives,
    icon: "⬡",
  },
  {
    id: "harvests",
    label: th.admin.harvests,
    mobileLabel: th.admin.harvests,
    icon: "◈",
  },
  {
    id: "inspections",
    label: th.admin.inspections,
    mobileLabel: th.admin.inspectionsShort,
    icon: "✓",
  },
  { id: "team", label: th.admin.team, mobileLabel: th.admin.team, icon: "♧" },
];

export function AdminLayout({
  email,
  role,
  section,
  onSectionChange,
  children,
}: {
  email?: string;
  role?: "owner" | "staff";
  section: AdminSection;
  onSectionChange: (section: AdminSection) => void;
  children: ReactNode;
}) {
  const items =
    role === "owner" ? sections : sections.filter((item) => item.id !== "team");
  return (
    <div className="min-h-screen bg-stone-50 pb-24 text-stone-900 lg:pb-0">
      <a href="#main-content" className="skip-link">
        {th.common.skip}
      </a>
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <a href="/" aria-label={th.public.logoHome}>
            <img
              src="/logo.png"
              alt="MetaFarm"
              width="500"
              height="196"
              className="h-10 w-auto"
            />
          </a>
          <div className="min-w-0 text-right">
            <p className="truncate text-xs font-semibold text-stone-800 sm:text-sm">
              {email ?? th.admin.checkingAccess}
            </p>
            <p className="text-xs text-stone-600">
              {role === "owner"
                ? th.admin.owner
                : role === "staff"
                  ? th.admin.staff
                  : ""}
            </p>
          </div>
        </div>
      </header>
      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10"
      >
        <div className="mb-6">
          <p className="text-sm font-bold text-honey-700">
            MetaFarm / Dashboard
          </p>
          <h1 className="mt-2 text-page font-black">{th.admin.title}</h1>
          <p className="mt-2 text-sm text-stone-600">{th.admin.description}</p>
        </div>
        {role && (
          <nav
            aria-label={th.admin.adminNav}
            className="mb-6 hidden gap-2 border-b border-stone-200 pb-4 lg:flex"
          >
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-current={section === item.id ? "page" : undefined}
                onClick={() => onSectionChange(item.id)}
                className={`min-h-11 rounded-control px-5 text-sm font-bold ${section === item.id ? "bg-leaf-800 text-white" : "text-stone-700 hover:bg-stone-100"}`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        )}
        {children}
      </main>
      {role && (
        <nav
          aria-label={th.admin.adminNavMobile}
          className="safe-bottom fixed inset-x-0 bottom-0 z-30 grid border-t border-stone-200 bg-white px-2 pt-1 shadow-float lg:hidden"
          style={{
            gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))`,
          }}
        >
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-label={item.label}
              aria-current={section === item.id ? "page" : undefined}
              onClick={() => onSectionChange(item.id)}
              className={`flex min-h-14 flex-col items-center justify-center rounded-control px-1 text-[11px] font-bold ${section === item.id ? "bg-leaf-50 text-leaf-800" : "text-stone-700"}`}
            >
              <span aria-hidden="true" className="text-base">
                {item.icon}
              </span>
              <span className="max-w-full truncate whitespace-nowrap">
                {item.mobileLabel}
              </span>
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}

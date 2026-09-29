import type { ReactNode } from "react";
import { th } from "../../i18n/th";

export type AdminSection = "hives" | "harvests" | "inspections" | "qr" | "team";
const sections: {
  id: AdminSection;
  label: string;
  mobileLabel: string;
  description: string;
  icon: string;
}[] = [
  {
    id: "hives",
    label: th.admin.hives,
    mobileLabel: th.admin.hives,
    description: th.admin.hivesDescription,
    icon: "⬡",
  },
  {
    id: "harvests",
    label: th.admin.harvests,
    mobileLabel: th.admin.harvests,
    description: th.admin.harvestsDescription,
    icon: "◈",
  },
  {
    id: "inspections",
    label: th.admin.inspections,
    mobileLabel: th.admin.inspectionsShort,
    description: th.admin.inspectionsDescription,
    icon: "✓",
  },
  {
    id: "qr",
    label: th.admin.qrLabels,
    mobileLabel: "QR",
    description: th.admin.qrDescription,
    icon: "▦",
  },
  {
    id: "team",
    label: th.admin.team,
    mobileLabel: th.admin.team,
    description: th.admin.teamDescription,
    icon: "♧",
  },
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
  const current = sections.find((item) => item.id === section) ?? sections[0];
  const roleLabel =
    role === "owner" ? th.admin.owner : role === "staff" ? th.admin.staff : "";

  return (
    <div className="min-h-screen bg-stone-50 pb-24 text-stone-900 lg:grid lg:grid-cols-[15rem_minmax(0,1fr)] lg:pb-0">
      <a href="#main-content" className="skip-link">
        {th.common.skip}
      </a>
      <aside className="hidden border-r border-stone-200 bg-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:p-5 print:hidden">
        <a
          href="/"
          aria-label={th.public.logoHome}
          className="inline-flex min-h-14 items-center"
        >
          <img
            src="/logo.png"
            alt="MetaFarm"
            width="500"
            height="196"
            className="h-10 w-auto"
          />
        </a>
        <p className="mt-8 px-3 text-xs font-bold uppercase tracking-wide text-stone-500">
          {th.admin.farmManagement}
        </p>
        {role && (
          <nav aria-label={th.admin.adminNav} className="mt-3 grid gap-1">
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-current={section === item.id ? "page" : undefined}
                onClick={() => onSectionChange(item.id)}
                className={`flex min-h-12 items-center gap-3 rounded-control px-3 text-left font-bold ${section === item.id ? "bg-leaf-50 text-leaf-800" : "text-stone-700 hover:bg-stone-100"}`}
              >
                <span aria-hidden="true" className="text-lg">
                  {item.icon}
                </span>
                {item.label}
              </button>
            ))}
          </nav>
        )}
        <div className="mt-auto border-t border-stone-200 px-3 pt-4">
          <p className="break-all text-sm font-semibold">
            {email ?? th.admin.checkingAccess}
          </p>
          <p className="text-xs text-stone-600">{roleLabel}</p>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="border-b border-stone-200 bg-white lg:hidden print:hidden">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2 sm:px-6">
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
              <p className="truncate text-xs font-semibold text-stone-800">
                {email ?? th.admin.checkingAccess}
              </p>
              <p className="text-xs text-stone-600">{roleLabel}</p>
            </div>
          </div>
        </header>
        <main
          id="main-content"
          tabIndex={-1}
          className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 lg:px-8 lg:py-8"
        >
          <div className="mb-4 lg:mb-6 print:hidden">
            <p className="text-xs font-bold text-honey-700">
              {th.admin.farmManagement}
            </p>
            <h1 className="mt-1 text-2xl font-black lg:text-page">
              {current.label}
            </h1>
            <p className="mt-1 hidden text-sm text-stone-600 lg:block">
              {current.description}
            </p>
          </div>
          {children}
        </main>
      </div>

      {role && (
        <nav
          aria-label={th.admin.adminNavMobile}
          className="safe-bottom fixed inset-x-0 bottom-0 z-30 grid border-t border-stone-200 bg-white px-2 pt-1 shadow-float lg:hidden print:hidden"
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

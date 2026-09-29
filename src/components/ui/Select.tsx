import type { SelectHTMLAttributes } from "react";

export function Select({
  className = "",
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`mt-1 block min-h-11 w-full rounded-control border border-stone-300 bg-white px-3 py-2 text-stone-900 ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}

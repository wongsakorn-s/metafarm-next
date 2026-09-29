import type { HTMLAttributes } from "react";

export function Card({
  className = "",
  children,
  ...props
}: HTMLAttributes<HTMLElement>) {
  return (
    <article
      className={`rounded-card border border-stone-200 bg-white p-5 shadow-card sm:p-6 ${className}`}
      {...props}
    >
      {children}
    </article>
  );
}

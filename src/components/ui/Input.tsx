import type { InputHTMLAttributes } from "react";

export function Input({
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`mt-1 block min-h-11 w-full rounded-control border border-stone-300 bg-white px-3 py-2 text-stone-900 placeholder:text-stone-500 ${className}`}
      {...props}
    />
  );
}

import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  ReactNode,
} from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  full?: boolean;
  children: ReactNode;
};

const variants = {
  primary: "bg-honey-500 text-stone-950 hover:bg-honey-400",
  secondary: "bg-leaf-800 text-white hover:bg-leaf-600",
  outline: "border border-stone-300 bg-white text-stone-900 hover:bg-stone-50",
  ghost: "text-stone-800 hover:bg-stone-100",
  danger: "bg-danger-700 text-white hover:bg-red-800",
};
const base =
  "inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-control px-5 py-2.5 text-sm font-bold transition-colors";

export function Button({
  variant = "primary",
  full = false,
  className = "",
  type = "button",
  children,
  ...props
}: Props) {
  return (
    <button
      type={type}
      className={`${base} disabled:opacity-50 ${variants[variant]} ${full ? "w-full" : ""} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function ButtonLink({
  variant = "primary",
  full = false,
  className = "",
  children,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & {
  variant?: Props["variant"];
  full?: boolean;
  children: ReactNode;
}) {
  return (
    <a
      className={`${base} ${variants[variant]} ${full ? "w-full" : ""} ${className}`}
      {...props}
    >
      {children}
    </a>
  );
}

import type { HTMLAttributes } from "react";

type Tone =
  | "neutral"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "hive-strong"
  | "hive-normal"
  | "hive-weak"
  | "hive-empty";
type Props = HTMLAttributes<HTMLSpanElement> & { tone?: Tone; icon?: string };
const tones: Record<Tone, string> = {
  neutral: "bg-stone-100 text-stone-800",
  success: "bg-success-50 text-success-700",
  warning: "bg-warning-50 text-warning-700",
  danger: "bg-danger-50 text-danger-700",
  info: "bg-info-50 text-info-700",
  "hive-strong": "bg-hive-strong-bg text-hive-strong",
  "hive-normal": "bg-hive-normal-bg text-hive-normal",
  "hive-weak": "bg-hive-weak-bg text-hive-weak",
  "hive-empty": "bg-hive-empty-bg text-hive-empty",
};

export function Badge({
  tone = "neutral",
  icon,
  className = "",
  children,
  ...props
}: Props) {
  return (
    <span
      className={`inline-flex min-h-7 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${tones[tone]} ${className}`}
      {...props}
    >
      {icon && <span aria-hidden="true">{icon}</span>}
      {children}
    </span>
  );
}

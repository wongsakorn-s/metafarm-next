import type { ReactNode } from "react";
import { Card } from "./Card";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <Card className="text-center">
      <span
        aria-hidden="true"
        className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-honey-100 text-honey-900"
      >
        ✦
      </span>
      <h3 className="mt-3 text-lg font-bold">{title}</h3>
      {description && (
        <p className="mt-2 text-sm text-stone-600">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </Card>
  );
}

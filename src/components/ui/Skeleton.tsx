import { th } from "../../i18n/th";
export function Skeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div
      role="status"
      aria-label={th.common.loadingData}
      className="space-y-3 rounded-card border border-stone-200 bg-white p-5"
    >
      {Array.from({ length: rows }, (_, index) => (
        <div
          key={index}
          className="h-6 animate-pulse rounded-control bg-stone-200"
          style={{ width: `${100 - index * 12}%` }}
        />
      ))}
      <span className="sr-only">{th.common.loadingData}</span>
    </div>
  );
}

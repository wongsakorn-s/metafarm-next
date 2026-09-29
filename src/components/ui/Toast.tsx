import { useEffect } from "react";
import { th } from "../../i18n/th";

export type ToastMessage = { message: string; kind: "success" | "error" };
export function Toast({
  notice,
  onClose,
}: {
  notice: ToastMessage | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!notice || notice.kind === "error") return;
    const id = window.setTimeout(onClose, 5000);
    return () => window.clearTimeout(id);
  }, [notice, onClose]);
  if (!notice) return null;
  return (
    <div
      role={notice.kind === "error" ? "alert" : "status"}
      className={`fixed inset-x-4 top-20 z-[80] mx-auto flex max-w-lg items-start gap-3 rounded-card border p-4 shadow-float ${notice.kind === "error" ? "border-danger-700 bg-danger-50 text-danger-700" : "border-success-700 bg-success-50 text-success-700"}`}
    >
      <span aria-hidden="true">{notice.kind === "error" ? "!" : "✓"}</span>
      <p className="min-w-0 flex-1 text-sm font-semibold">{notice.message}</p>
      <button
        type="button"
        onClick={onClose}
        aria-label={th.common.closeMessage}
        className="grid min-h-11 min-w-11 place-items-center rounded-control"
      >
        ×
      </button>
    </div>
  );
}

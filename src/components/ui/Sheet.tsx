import { useEffect, useRef, type ReactNode } from "react";
import { th } from "../../i18n/th";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  side?: "bottom" | "right";
  id?: string;
  dialogRole?: "dialog" | "alertdialog";
};

export function Sheet({
  open,
  onClose,
  title,
  children,
  side = "bottom",
  id,
  dialogRole = "dialog",
}: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  useEffect(() => {
    if (!open) return;
    const previousFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCloseRef.current();
      if (event.key !== "Tab") return;
      const focusables = dialogRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusables?.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [open]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70]">
      <button
        type="button"
        aria-label={th.common.closeDialog}
        onClick={onClose}
        className="absolute inset-0 h-full w-full bg-stone-950/55"
      />
      <div
        ref={dialogRef}
        id={id}
        role={dialogRole}
        aria-modal="true"
        aria-label={title}
        className={`absolute flex flex-col overflow-hidden bg-white shadow-float ${side === "right" ? "inset-y-0 right-0 h-full w-full max-w-md" : "inset-x-0 bottom-0 max-h-[85dvh] rounded-t-hero sm:mx-auto sm:max-w-xl"}`}
      >
        <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4">
          <h2 className="text-lg font-bold">{title}</h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label={th.common.close}
            className="grid min-h-11 min-w-11 place-items-center rounded-control bg-stone-100 text-xl"
          >
            ×
          </button>
        </div>
        <div className="safe-bottom overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}

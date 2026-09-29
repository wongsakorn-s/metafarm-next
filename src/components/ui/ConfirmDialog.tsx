import { Button } from "./Button";
import { Sheet } from "./Sheet";
import { th } from "../../i18n/th";

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  destructive = false,
  busy = false,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  destructive?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Sheet open={open} onClose={onClose} title={title} dialogRole="alertdialog">
      <p className="text-stone-700">{description}</p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <Button variant="outline" full onClick={onClose} disabled={busy}>
          {th.common.cancel}
        </Button>
        <Button
          variant={destructive ? "danger" : "secondary"}
          full
          onClick={onConfirm}
          disabled={busy}
        >
          {confirmLabel}
        </Button>
      </div>
    </Sheet>
  );
}

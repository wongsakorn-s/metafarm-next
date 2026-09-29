import { useEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "../ui/Button";
import { Sheet } from "../ui/Sheet";

export function FeaturePanel({
  title,
  actionLabel,
  form,
  list,
  savedVersion,
}: {
  title: string;
  actionLabel: string;
  form: ReactNode;
  list: ReactNode;
  savedVersion: number;
}) {
  const [open, setOpen] = useState(false);
  const previousVersion = useRef(savedVersion);
  useEffect(() => {
    if (previousVersion.current !== savedVersion) setOpen(false);
    previousVersion.current = savedVersion;
  }, [savedVersion]);
  return (
    <section aria-label={title} className="pb-20 lg:pb-0">
      <div className="lg:grid lg:grid-cols-[minmax(280px,340px)_minmax(0,1fr)] lg:items-start lg:gap-6">
        <div className="hidden lg:block">{form}</div>
        <div className="min-w-0">{list}</div>
      </div>
      <div className="fixed inset-x-4 bottom-[calc(5.4rem+env(safe-area-inset-bottom))] z-20 lg:hidden">
        <Button full className="shadow-float" onClick={() => setOpen(true)}>
          ＋ {actionLabel}
        </Button>
      </div>
      <Sheet open={open} onClose={() => setOpen(false)} title={title}>
        {form}
      </Sheet>
    </section>
  );
}

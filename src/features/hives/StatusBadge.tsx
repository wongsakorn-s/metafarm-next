import { Badge } from "../../components/ui/Badge";
import { th } from "../../i18n/th";

export function StatusBadge({ status }: { status: string }) {
  const config = th.status[status as keyof typeof th.status];
  return (
    <Badge tone={config?.tone ?? "neutral"} icon={config?.icon ?? "?"}>
      {config?.label ?? status}
    </Badge>
  );
}

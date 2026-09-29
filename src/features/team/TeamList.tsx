import { useState } from "react";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { Badge } from "../../components/ui/Badge";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { th } from "../../i18n/th";
import type { TeamMember } from "../../lib/api";

export function TeamList({
  team,
  busy,
  onToggle,
}: {
  team: TeamMember[];
  busy: boolean;
  onToggle: (email: string, active: boolean) => Promise<boolean>;
}) {
  const [pending, setPending] = useState<TeamMember | null>(null);
  if (!team.length) return <EmptyState title={th.admin.noTeam} />;
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-bold">
        {th.admin.team} ({team.length})
      </h2>
      {team.map((member) => (
        <Card
          key={member.email}
          className="flex flex-wrap items-center justify-between gap-3"
        >
          <div className="min-w-0">
            <p className="break-all font-semibold">{member.email}</p>
            <Badge
              tone={member.active ? "success" : "neutral"}
              className="mt-2"
              icon={member.active ? "✓" : "○"}
            >
              {member.active ? th.admin.active : th.admin.inactive}
            </Badge>
          </div>
          <Button
            variant="outline"
            disabled={busy}
            onClick={() => setPending(member)}
          >
            {member.active ? th.admin.deactivate : th.admin.activate}
          </Button>
        </Card>
      ))}
      <ConfirmDialog
        open={pending !== null}
        title={
          pending?.active
            ? th.admin.confirmDeactivate
            : th.admin.confirmActivate
        }
        description={`${pending?.email ?? ""} — ${pending?.active ? th.admin.deactivateWarning : th.admin.activateWarning}`}
        confirmLabel={pending?.active ? th.admin.deactivate : th.admin.activate}
        destructive={pending?.active}
        busy={busy}
        onClose={() => setPending(null)}
        onConfirm={async () => {
          if (!pending) return;
          if (await onToggle(pending.email, !pending.active)) setPending(null);
        }}
      />
    </div>
  );
}

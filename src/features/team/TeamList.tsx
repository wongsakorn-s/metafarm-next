import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { Badge } from "../../components/ui/Badge";
import { th } from "../../i18n/th";
import type { TeamMember } from "../../lib/api";

export function TeamList({
  team,
  busy,
  onToggle,
}: {
  team: TeamMember[];
  busy: boolean;
  onToggle: (email: string, active: boolean) => void;
}) {
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
            onClick={() => onToggle(member.email, !member.active)}
          >
            {member.active ? th.admin.deactivate : th.admin.activate}
          </Button>
        </Card>
      ))}
    </div>
  );
}

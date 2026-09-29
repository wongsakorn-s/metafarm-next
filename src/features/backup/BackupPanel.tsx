import { useState } from "react";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Field } from "../../components/ui/Field";
import { Input } from "../../components/ui/Input";
import { th } from "../../i18n/th";
import { farmDate } from "../../lib/date";

export function BackupPanel() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [downloaded, setDownloaded] = useState(false);

  async function download() {
    if (from && to && from > to) {
      setError(th.admin.invalidDateRange);
      return;
    }
    setBusy(true);
    setError("");
    setDownloaded(false);
    try {
      const params = new URLSearchParams();
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      const response = await fetch(`/api/export${params.size ? `?${params}` : ""}`, {
        credentials: "same-origin",
        cache: "no-store",
      });
      if (!response.ok) {
        const result = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(result?.error ?? th.admin.exportFailed);
      }
      if (!response.headers.get("Content-Type")?.includes("application/json")) {
        throw new Error(th.admin.exportSessionExpired);
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `metafarm-records-${farmDate()}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
      setDownloaded(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : th.admin.exportFailed);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <h2 className="text-lg font-bold">{th.admin.exportTitle}</h2>
      <p className="mt-2 text-sm text-stone-700">{th.admin.exportDescription}</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Field label={th.admin.fromDate}>
          {(id) => (
            <Input
              id={id}
              type="date"
              value={from}
              max={to || undefined}
              onChange={(event) => setFrom(event.target.value)}
            />
          )}
        </Field>
        <Field label={th.admin.toDate}>
          {(id) => (
            <Input
              id={id}
              type="date"
              value={to}
              min={from || undefined}
              onChange={(event) => setTo(event.target.value)}
            />
          )}
        </Field>
      </div>
      <Button type="button" disabled={busy} onClick={download} className="mt-4">
        {busy ? th.admin.exporting : th.admin.exportButton}
      </Button>
      {error && <p role="alert" className="mt-3 text-sm text-danger-700">{error}</p>}
      {downloaded && <p role="status" className="mt-3 text-sm text-success-700">{th.admin.exportStarted}</p>}
    </Card>
  );
}

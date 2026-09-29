import { useState, type FormEvent } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { Field } from "../../components/ui/Field";
import { Input } from "../../components/ui/Input";
import { Sheet } from "../../components/ui/Sheet";
import { th } from "../../i18n/th";
import { api, type Hive } from "../../lib/api";
import { QRScanner } from "./QRScanner";
import { parseScannedQr } from "./qrValue";

export function QRStation({ hives }: { hives: Hive[] }) {
  const [code, setCode] = useState("");
  const [scanning, setScanning] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>(hives.map((hive) => hive.id));
  const selectedHives = hives.filter((hive) => selectedIds.includes(hive.id));

  async function openHive(value: string) {
    const normalized = parseScannedQr(value, window.location.origin);
    if (!normalized) {
      setError(th.admin.invalidQr);
      return;
    }
    setBusy(true);
    setError("");
    try {
      const hive = await api<{ id: string }>(
        `/hives/by-code/${encodeURIComponent(normalized)}`,
      );
      window.location.assign(`/admin/hives/${hive.id}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : th.admin.loadFailed);
    } finally {
      setBusy(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void openHive(code);
  }

  return (
    <div className="space-y-6">
      <Card className="print:hidden">
        <form
          onSubmit={submit}
          className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end"
        >
          <Field label={th.admin.qrCodeLabel}>
            {(id) => (
              <Input
                id={id}
                value={code}
                onChange={(event) => setCode(event.target.value)}
                maxLength={40}
              />
            )}
          </Field>
          <Button type="submit" variant="outline" disabled={busy || !code.trim()}>
            {th.admin.openHive}
          </Button>
          <Button onClick={() => setScanning(true)}>
            {th.admin.scanQr}
          </Button>
        </form>
        {error && (
          <p role="alert" className="mt-3 text-danger-700">
            {error}
          </p>
        )}
      </Card>
      {hives.length > 0 && <Card className="print:hidden">
        <h2 className="text-lg font-bold">{th.admin.choosePrintHives}</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setSelectedIds(hives.map((hive) => hive.id))}>
            {th.admin.selectAllHives}
          </Button>
          <Button variant="outline" onClick={() => setSelectedIds([])}>
            {th.admin.clearSelectedHives}
          </Button>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {hives.map((hive) => <label key={hive.id} className="flex min-h-11 items-center gap-3 rounded-control border border-stone-200 p-3">
            <input type="checkbox" checked={selectedIds.includes(hive.id)}
              onChange={(event) => setSelectedIds((current) => event.target.checked
                ? [...current, hive.id] : current.filter((id) => id !== hive.id))}
              className="h-5 w-5 accent-leaf-800" />
            <span className="min-w-0 break-words font-semibold">{hive.code} · {hive.name}</span>
          </label>)}
        </div>
      </Card>}
      <div className="flex items-center justify-between gap-3 print:hidden">
        <h2 className="text-lg font-bold">{th.admin.qrLabels}</h2>
        <Button onClick={() => window.print()} disabled={!selectedHives.length}>
          {th.admin.printLabels}
        </Button>
      </div>
      {selectedHives.length ? (
        <div className="qr-print grid gap-3 sm:grid-cols-2 lg:grid-cols-3 print:grid-cols-3 print:gap-2">
          {selectedHives.map((hive) => (
            <Card
              key={hive.id}
              className="break-inside-avoid text-center print:rounded-none print:shadow-none"
            >
              <QRCodeSVG
                value={`${window.location.origin}/admin/qr/${encodeURIComponent(hive.code)}`}
                size={96}
                level="H"
                className="mx-auto"
                title={`${th.admin.hiveCode} ${hive.code}`}
              />
              <p className="mt-1 break-all font-bold">{hive.code}</p>
              <p className="text-xs text-stone-600">{hive.name}</p>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title={hives.length ? th.admin.noSelectedHives : th.admin.noHives}
          description={hives.length ? undefined : th.admin.noHivesDescription}
        />
      )}
      <Sheet
        open={scanning}
        onClose={() => setScanning(false)}
        title={th.admin.scanQr}
      >
        {scanning && (
          <QRScanner
            onScan={(value) => {
              setScanning(false);
              setCode(parseScannedQr(value, window.location.origin) ?? "");
              void openHive(value);
            }}
          />
        )}
      </Sheet>
    </div>
  );
}

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

export function QRStation({ hives }: { hives: Hive[] }) {
  const [code, setCode] = useState("");
  const [scanning, setScanning] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function openHive(value: string) {
    const normalized = value.trim().toUpperCase();
    if (!normalized) return;
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
          <Button type="submit" disabled={busy || !code.trim()}>
            {th.admin.openHive}
          </Button>
          <Button variant="outline" onClick={() => setScanning(true)}>
            {th.admin.scanQr}
          </Button>
        </form>
        {error && (
          <p role="alert" className="mt-3 text-danger-700">
            {error}
          </p>
        )}
      </Card>
      <div className="flex items-center justify-between gap-3 print:hidden">
        <h2 className="text-lg font-bold">{th.admin.qrLabels}</h2>
        <Button onClick={() => window.print()} disabled={!hives.length}>
          {th.admin.printLabels}
        </Button>
      </div>
      {hives.length ? (
        <div className="qr-print grid gap-3 sm:grid-cols-2 lg:grid-cols-3 print:grid-cols-3 print:gap-2">
          {hives.map((hive) => (
            <Card
              key={hive.id}
              className="break-inside-avoid text-center print:min-h-44 print:rounded-none print:shadow-none"
            >
              <QRCodeSVG
                value={hive.code}
                size={128}
                level="H"
                className="mx-auto"
                title={`${th.admin.hiveCode} ${hive.code}`}
              />
              <p className="mt-3 break-all font-bold">{hive.code}</p>
              <p className="text-sm text-stone-600">{hive.name}</p>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title={th.admin.noHives}
          description={th.admin.noHivesDescription}
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
              setCode(value);
              void openHive(value);
            }}
          />
        )}
      </Sheet>
    </div>
  );
}

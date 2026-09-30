import { useEffect, useState } from "react";
import { AdminLayout } from "../components/layout/AdminLayout";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { Skeleton } from "../components/ui/Skeleton";
import { parseScannedQr } from "../features/qr/qrValue";
import { th } from "../i18n/th";
import { api } from "../lib/api";

export function QRRedirectPage() {
  const [error, setError] = useState("");
  const code = parseScannedQr(window.location.href, window.location.origin);

  useEffect(() => {
    if (!code) {
      setError(th.admin.invalidQr);
      return;
    }
    let active = true;
    api<{ id: string }>(`/hives/by-code/${encodeURIComponent(code)}`)
      .then((hive) => {
        if (active) window.location.replace(`/admin/hives/${hive.id}`);
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : th.admin.loadFailed);
      });
    return () => { active = false; };
  }, [code]);

  return <AdminLayout section="hives" onSectionChange={(section) => window.location.assign(`/admin#${section}`)}>
    {error ? <EmptyState title={th.admin.invalidQr} description={error}
      action={<Button onClick={() => window.location.assign("/admin#qr")}>{th.admin.scanQr}</Button>} />
      : <Skeleton />}
  </AdminLayout>;
}

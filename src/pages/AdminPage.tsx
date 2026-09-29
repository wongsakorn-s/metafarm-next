import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import {
  AdminLayout,
  type AdminSection,
} from "../components/layout/AdminLayout";
import { FeaturePanel } from "../components/layout/FeaturePanel";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { Skeleton } from "../components/ui/Skeleton";
import { Toast, type ToastMessage } from "../components/ui/Toast";
import { DashboardSummary } from "../features/dashboard/DashboardSummary";
import { WeatherPanel } from "../features/dashboard/WeatherPanel";
import { BackupPanel } from "../features/backup/BackupPanel";
import { HiveForm } from "../features/hives/HiveForm";
import { HiveList } from "../features/hives/HiveList";
import { HiveDetail } from "../features/hives/HiveDetail";
import { HarvestForm } from "../features/harvests/HarvestForm";
import { HarvestList } from "../features/harvests/HarvestList";
import { InspectionForm } from "../features/inspections/InspectionForm";
import { InspectionList } from "../features/inspections/InspectionList";
import { TeamForm } from "../features/team/TeamForm";
import { TeamList } from "../features/team/TeamList";
import { QRStation } from "../features/qr/QRStation";
import { th } from "../i18n/th";
import {
  api,
  type Dashboard,
  type Harvest,
  type Hive,
  type Inspection,
} from "../lib/api";
import { farmDate } from "../lib/date";
import { prepareImage } from "../lib/image";
import { useHistory } from "../lib/useHistory";
import { useOnlineStatus } from "../lib/useOnlineStatus";
import { uploadPhoto } from "../lib/uploadPhoto";

const sections: AdminSection[] = [
  "hives",
  "harvests",
  "inspections",
  "qr",
  "team",
];

function initialSection(): AdminSection {
  const hash = window.location.hash.slice(1);
  return sections.includes(hash as AdminSection)
    ? (hash as AdminSection)
    : "hives";
}

async function validatedImage(value: FormDataEntryValue | null): Promise<File | null> {
  if (!(value instanceof File) || value.size === 0) return null;
  return prepareImage(value);
}

export function AdminPage() {
  const today = farmDate();
  const detailHiveId = /^\/admin\/hives\/([0-9a-f-]{36})\/?$/.exec(
    window.location.pathname,
  )?.[1];
  const defaultHiveId =
    new URLSearchParams(window.location.search).get("hive") ?? undefined;
  const [data, setData] = useState<Dashboard | null>(null);
  const [section, setSection] = useState<AdminSection>(initialSection);
  const [notice, setNotice] = useState<ToastMessage | null>(null);
  const [loadError, setLoadError] = useState("");
  const [busy, setBusy] = useState(false);
  const [savedVersion, setSavedVersion] = useState(0);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [pendingPhoto, setPendingPhoto] = useState<{ inspectionId: string; image: File } | null>(null);
  const online = useOnlineStatus();
  const requestKeys = useRef(new WeakMap<HTMLFormElement, string>());
  const harvestHistory = useHistory<Harvest>(
    "harvests",
    data?.harvests,
    data?.summary.harvestCount,
  );
  const inspectionHistory = useHistory<Inspection>(
    "inspections",
    data?.inspections,
    data?.summary.inspectionCount,
  );
  const closeNotice = useCallback(() => setNotice(null), []);

  function keyFor(form: HTMLFormElement) {
    const existing = requestKeys.current.get(form);
    if (existing) return existing;
    const key = crypto.randomUUID();
    requestKeys.current.set(form, key);
    return key;
  }

  function resetRequestKey(form: HTMLFormElement, fieldName: string) {
    if (fieldName !== "image") requestKeys.current.delete(form);
  }

  useEffect(() => {
    document.title = `${th.admin.farmManagement} | MetaFarm`;
    document
      .querySelector<HTMLMetaElement>('meta[name="description"]')
      ?.setAttribute("content", th.admin.description);
  }, []);
  const refresh = useCallback(async () => {
    const result = await api<Dashboard>(`/dashboard?month=${farmDate().slice(0, 7)}`);
    setData(result);
    setLoadError("");
  }, []);
  useEffect(() => {
    refresh().catch((cause: Error) => setLoadError(cause.message));
  }, [refresh]);
  useEffect(() => {
    if (data && data.staff.role !== "owner" && section === "team")
      changeSection("hives");
  }, [data, section]);

  function changeSection(value: AdminSection) {
    if (detailHiveId) {
      window.location.assign(`/admin#${value}`);
      return;
    }
    setSection(value);
    window.history.replaceState(null, "", `#${value}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submit(
    event: FormEvent<HTMLFormElement>,
    action: () => Promise<unknown>,
    resetAfter = true,
  ): Promise<boolean> {
    event.preventDefault();
    if (!online) {
      setNotice({ message: th.admin.offlineSaveDisabled, kind: "error" });
      return false;
    }
    const form = event.currentTarget;
    const submitter = (event.nativeEvent as SubmitEvent).submitter;
    setBusy(true);
    setNotice(null);
    try {
      await action();
      await refresh();
      setNotice({ message: th.admin.saved, kind: "success" });
      setSavedVersion((version) => version + 1);
      if (resetAfter) form.reset();
      return true;
    } catch (cause) {
      await refresh().catch(() => undefined);
      setNotice({
        message: cause instanceof Error ? cause.message : th.admin.saveFailed,
        kind: "error",
      });
      return false;
    } finally {
      setBusy(false);
      requestAnimationFrame(() => {
        if (submitter instanceof HTMLElement && submitter.isConnected)
          submitter.focus();
      });
    }
  }

  function hiveName(id: string) {
    const hive = data?.hives.find((item) => item.id === id);
    return hive ? `${hive.code} · ${hive.name}` : id;
  }

  async function createHive(event: FormEvent<HTMLFormElement>) {
    const form = event.currentTarget;
    await submit(event, () =>
      api("/hives", {
        method: "POST",
        body: JSON.stringify(Object.fromEntries(new FormData(form))),
      }),
    );
  }
  async function updateHive(event: FormEvent<HTMLFormElement>, hive: Hive): Promise<boolean> {
    const form = event.currentTarget;
    return submit(
      event,
      () =>
        api(`/hives/${hive.id}`, {
          method: "PATCH",
          body: JSON.stringify(Object.fromEntries(new FormData(form))),
        }),
      false,
    );
  }
  async function createHarvest(event: FormEvent<HTMLFormElement>): Promise<boolean> {
    const form = event.currentTarget;
    const key = keyFor(form);
    const saved = await submit(event, () => {
      const values = Object.fromEntries(new FormData(form));
      return api("/harvests", {
        method: "POST",
        headers: { "Idempotency-Key": key },
        body: JSON.stringify({
          ...values,
          honeyMl: Number(values.honeyMl),
          propolisG: Number(values.propolisG),
        }),
      });
    });
    if (saved) requestKeys.current.delete(form);
    return saved;
  }
  async function mutateRecord(action: () => Promise<unknown>): Promise<boolean> {
    if (!online) {
      setNotice({ message: th.admin.offlineSaveDisabled, kind: "error" });
      return false;
    }
    setBusy(true);
    setNotice(null);
    try {
      await action();
      await refresh();
      setSavedVersion((version) => version + 1);
      setNotice({ message: th.admin.saved, kind: "success" });
      return true;
    } catch (cause) {
      setNotice({
        message: cause instanceof Error ? cause.message : th.admin.saveFailed,
        kind: "error",
      });
      return false;
    } finally {
      setBusy(false);
    }
  }
  async function editHarvest(id: string, event: FormEvent<HTMLFormElement>): Promise<boolean> {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    return mutateRecord(() => api(`/harvests/${id}`, {
      method: "PATCH",
      body: JSON.stringify({
        ...values,
        honeyMl: Number(values.honeyMl),
        propolisG: Number(values.propolisG),
      }),
    }));
  }
  async function deleteHarvest(id: string): Promise<boolean> {
    return mutateRecord(() => api(`/harvests/${id}`, { method: "DELETE" }));
  }
  async function editInspection(id: string, event: FormEvent<HTMLFormElement>): Promise<boolean> {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    return mutateRecord(() => api(`/inspections/${id}`, {
      method: "PATCH",
      body: JSON.stringify({
        inspectedAt: values.inspectedAt,
        status: values.status,
        notes: values.notes,
      }),
    }));
  }
  async function deleteInspection(id: string): Promise<boolean> {
    return mutateRecord(() => api(`/inspections/${id}`, { method: "DELETE" }));
  }
  async function archiveHive(id: string): Promise<boolean> {
    return mutateRecord(() => api(`/hives/${id}/archive`, { method: "POST" }));
  }
  async function restoreHive(id: string): Promise<boolean> {
    return mutateRecord(() => api(`/hives/${id}/restore`, { method: "POST" }));
  }
  async function createInspection(event: FormEvent<HTMLFormElement>): Promise<boolean> {
    const form = event.currentTarget;
    const key = keyFor(form);
    let savedWithoutPhoto = false;
    const saved = await submit(event, async () => {
      const values = Object.fromEntries(new FormData(form));
      const image = await validatedImage(values.image ?? null);
      delete values.image;
      if (!values.status) delete values.status;
      const record = await api<Inspection>("/inspections", {
        method: "POST",
        headers: { "Idempotency-Key": key },
        body: JSON.stringify(values),
      });
      if (image) {
        setUploadProgress(0);
        try {
          await uploadPhoto(record.id, image, setUploadProgress);
          setPendingPhoto(null);
        } catch (cause) {
          savedWithoutPhoto = true;
          setPendingPhoto({ inspectionId: record.id, image });
          throw new Error(
            `${th.admin.uploadPartial}: ${cause instanceof Error ? cause.message : th.common.retry}`,
          );
        } finally {
          setUploadProgress(null);
        }
      }
    });
    if (saved || savedWithoutPhoto) requestKeys.current.delete(form);
    if (savedWithoutPhoto) setSavedVersion((version) => version + 1);
    return saved || savedWithoutPhoto;
  }
  async function uploadInspectionPhoto(
    event: FormEvent<HTMLFormElement>,
    inspectionId: string,
  ) {
    const form = event.currentTarget;
    await submit(event, async () => {
      const image = await validatedImage(new FormData(form).get("image"));
      if (!image) throw new Error(th.admin.photoRequired);
      setUploadProgress(0);
      try {
        await uploadPhoto(inspectionId, image, setUploadProgress);
      } finally {
        setUploadProgress(null);
      }
    });
  }
  async function retryPendingPhoto() {
    if (!pendingPhoto || !online || busy) return;
    setBusy(true);
    setUploadProgress(0);
    try {
      await uploadPhoto(pendingPhoto.inspectionId, pendingPhoto.image, setUploadProgress);
      await refresh();
      setPendingPhoto(null);
      setSavedVersion((version) => version + 1);
      setNotice({ message: th.admin.saved, kind: "success" });
    } catch (cause) {
      setNotice({ message: cause instanceof Error ? cause.message : th.admin.uploadPartial, kind: "error" });
    } finally {
      setBusy(false);
      setUploadProgress(null);
    }
  }
  async function createTeam(event: FormEvent<HTMLFormElement>) {
    const form = event.currentTarget;
    await submit(event, () =>
      api("/team", {
        method: "POST",
        body: JSON.stringify(Object.fromEntries(new FormData(form))),
      }),
    );
  }
  async function toggleTeam(email: string, active: boolean) {
    setBusy(true);
    setNotice(null);
    try {
      await api(`/team/${encodeURIComponent(email)}`, {
        method: "PATCH",
        body: JSON.stringify({ active }),
      });
      await refresh();
      setNotice({ message: th.admin.roleChanged, kind: "success" });
      return true;
    } catch (cause) {
      setNotice({
        message:
          cause instanceof Error ? cause.message : th.admin.roleChangeFailed,
        kind: "error",
      });
      return false;
    } finally {
      setBusy(false);
    }
  }

  return (
    <AdminLayout
      email={data?.staff.email}
      role={data?.staff.role}
      section={section}
      onSectionChange={changeSection}
    >
      <Toast notice={notice} onClose={closeNotice} />
      {!online && <p role="status" className="mb-4 rounded-control bg-warning-50 p-3 text-warning-700">{th.admin.offline}</p>}
      {uploadProgress !== null && <div role="status" className="fixed inset-x-4 top-[max(0.5rem,env(safe-area-inset-top))] z-[80] mx-auto max-w-lg rounded-control bg-info-50 p-3 text-info-700 shadow-float">
        <p>{th.admin.uploadProgress}: {uploadProgress}%</p>
        <progress value={uploadProgress} max={100} className="mt-2 w-full" />
      </div>}
      {pendingPhoto && <div className="mb-4 rounded-control bg-warning-50 p-3 text-warning-700">
        <p>{th.admin.uploadPartial}</p>
        <Button variant="outline" disabled={busy || !online} onClick={() => void retryPendingPhoto()} className="mt-2">
          {th.admin.retryPhotoUpload}
        </Button>
      </div>}
      {!data ? (
        loadError ? (
          <EmptyState
            title={th.admin.loadFailed}
            description={loadError}
            action={
              <Button
                onClick={() => {
                  setLoadError("");
                  refresh().catch((cause: Error) =>
                    setLoadError(cause.message),
                  );
                }}
              >
                {th.common.retry}
              </Button>
            }
          />
        ) : (
          <Skeleton />
        )
      ) : (
        <div className="flex flex-col gap-6">
          {!detailHiveId && (
            <div
              className={`${section === "hives" ? "order-2" : "hidden"} lg:order-1 lg:block print:hidden`}
            >
              <div className="space-y-4">
                <DashboardSummary data={data} />
                <WeatherPanel />
              </div>
            </div>
          )}
          <div className="order-1 lg:order-2">
            {section === "hives" &&
              (detailHiveId ? (
                <HiveDetail
                  hiveId={detailHiveId}
                  owner={data.staff.role === "owner"}
                  hives={data.hives}
                  actorEmail={data.staff.email}
                  today={today}
                  busy={busy}
                  savedVersion={savedVersion}
                  onEditHarvest={editHarvest}
                  onDeleteHarvest={deleteHarvest}
                  onEditInspection={editInspection}
                  onDeleteInspection={deleteInspection}
                  onCreateInspection={createInspection}
                  onCreateInput={resetRequestKey}
                />
              ) : (
                <FeaturePanel
                  title={th.admin.addHive}
                  actionLabel={th.admin.addHive}
                  savedVersion={savedVersion}
                  form={<HiveForm busy={busy} onSubmit={createHive} />}
                  list={
                    <HiveList
                      hives={data.hives}
                      busy={busy}
                      onUpdate={updateHive}
                      owner={data.staff.role === "owner"}
                      savedVersion={savedVersion}
                      onArchive={archiveHive}
                      onRestore={restoreHive}
                    />
                  }
                />
              ))}
            {section === "harvests" && (
              <FeaturePanel
                title={th.admin.addHarvest}
                actionLabel={th.admin.addHarvest}
                savedVersion={savedVersion}
                form={
                  <HarvestForm
                    hives={data.hives}
                    defaultHiveId={defaultHiveId}
                    today={today}
                    busy={busy}
                    onSubmit={createHarvest}
                    actorEmail={data.staff.email}
                    onInputChange={resetRequestKey}
                  />
                }
                list={
                  <HarvestList
                    history={harvestHistory}
                    hiveName={hiveName}
                    hives={data.hives}
                    busy={busy}
                    today={today}
                    onEdit={editHarvest}
                    onDelete={deleteHarvest}
                  />
                }
              />
            )}
            {section === "inspections" && (
              <FeaturePanel
                title={th.admin.addInspection}
                actionLabel={th.admin.addInspection}
                savedVersion={savedVersion}
                form={
                  <InspectionForm
                    hives={data.hives}
                    defaultHiveId={defaultHiveId}
                    today={today}
                    busy={busy}
                    onSubmit={createInspection}
                    actorEmail={data.staff.email}
                    onInputChange={resetRequestKey}
                  />
                }
                list={
                  <InspectionList
                    history={inspectionHistory}
                    hiveName={hiveName}
                    hives={data.hives}
                    today={today}
                    busy={busy}
                    onEdit={editInspection}
                    onDelete={deleteInspection}
                    onUpload={uploadInspectionPhoto}
                    savedVersion={savedVersion}
                  />
                }
              />
            )}
            {section === "team" && data.staff.role === "owner" && (
              <FeaturePanel
                title={th.admin.addTeam}
                actionLabel={th.admin.addTeam}
                savedVersion={savedVersion}
                form={<TeamForm busy={busy} onSubmit={createTeam} />}
                list={
                  <div className="space-y-6">
                    <TeamList
                      team={data.team}
                      busy={busy}
                      onToggle={toggleTeam}
                    />
                    <BackupPanel />
                  </div>
                }
              />
            )}
            {section === "qr" && <QRStation hives={data.hives} />}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

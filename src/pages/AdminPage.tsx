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
  type HistoryPage,
  type Hive,
  type Inspection,
} from "../lib/api";
import { farmDate } from "../lib/date";
import { prepareImage } from "../lib/image";

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
  const [extraHarvests, setExtraHarvests] = useState<Harvest[]>([]);
  const [extraInspections, setExtraInspections] = useState<Inspection[]>([]);
  const [harvestNextOffset, setHarvestNextOffset] = useState<number | null>(null);
  const [inspectionNextOffset, setInspectionNextOffset] = useState<number | null>(null);
  const [harvestLoading, setHarvestLoading] = useState(false);
  const [inspectionLoading, setInspectionLoading] = useState(false);
  const [harvestLoadError, setHarvestLoadError] = useState("");
  const [inspectionLoadError, setInspectionLoadError] = useState("");
  const historyVersion = useRef(0);
  const closeNotice = useCallback(() => setNotice(null), []);

  useEffect(() => {
    document.title = `${th.admin.farmManagement} | MetaFarm`;
    document
      .querySelector<HTMLMetaElement>('meta[name="description"]')
      ?.setAttribute("content", th.admin.description);
  }, []);
  const refresh = useCallback(async () => {
    const result = await api<Dashboard>(`/dashboard?month=${farmDate().slice(0, 7)}`);
    historyVersion.current += 1;
    setData(result);
    setExtraHarvests([]);
    setExtraInspections([]);
    setHarvestNextOffset(
      result.summary.harvestCount > result.harvests.length
        ? result.harvests.length
        : null,
    );
    setInspectionNextOffset(
      result.summary.inspectionCount > result.inspections.length
        ? result.inspections.length
        : null,
    );
    setHarvestLoadError("");
    setInspectionLoadError("");
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
  ) {
    event.preventDefault();
    const form = event.currentTarget;
    setBusy(true);
    setNotice(null);
    try {
      await action();
      await refresh();
      setNotice({ message: th.admin.saved, kind: "success" });
      setSavedVersion((version) => version + 1);
      if (resetAfter) form.reset();
    } catch (cause) {
      await refresh().catch(() => undefined);
      setNotice({
        message: cause instanceof Error ? cause.message : th.admin.saveFailed,
        kind: "error",
      });
    } finally {
      setBusy(false);
    }
  }

  function hiveName(id: string) {
    const hive = data?.hives.find((item) => item.id === id);
    return hive ? `${hive.code} · ${hive.name}` : id;
  }

  async function loadMoreHarvests() {
    if (harvestNextOffset === null || harvestLoading) return;
    const version = historyVersion.current;
    setHarvestLoading(true);
    setHarvestLoadError("");
    try {
      const page = await api<HistoryPage<Harvest>>(
        `/harvests?offset=${harvestNextOffset}&limit=50`,
      );
      if (version !== historyVersion.current) return;
      setExtraHarvests((current) => {
        const seen = new Set([...(data?.harvests ?? []), ...current].map((item) => item.id));
        return [...current, ...page.items.filter((item) => !seen.has(item.id))];
      });
      setHarvestNextOffset(page.nextOffset);
    } catch (cause) {
      if (version === historyVersion.current)
        setHarvestLoadError(cause instanceof Error ? cause.message : th.admin.loadFailed);
    } finally {
      setHarvestLoading(false);
    }
  }

  async function loadMoreInspections() {
    if (inspectionNextOffset === null || inspectionLoading) return;
    const version = historyVersion.current;
    setInspectionLoading(true);
    setInspectionLoadError("");
    try {
      const page = await api<HistoryPage<Inspection>>(
        `/inspections?offset=${inspectionNextOffset}&limit=50`,
      );
      if (version !== historyVersion.current) return;
      setExtraInspections((current) => {
        const seen = new Set([...(data?.inspections ?? []), ...current].map((item) => item.id));
        return [...current, ...page.items.filter((item) => !seen.has(item.id))];
      });
      setInspectionNextOffset(page.nextOffset);
    } catch (cause) {
      if (version === historyVersion.current)
        setInspectionLoadError(cause instanceof Error ? cause.message : th.admin.loadFailed);
    } finally {
      setInspectionLoading(false);
    }
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
  async function updateHive(event: FormEvent<HTMLFormElement>, hive: Hive) {
    const form = event.currentTarget;
    await submit(
      event,
      () =>
        api(`/hives/${hive.id}`, {
          method: "PATCH",
          body: JSON.stringify(Object.fromEntries(new FormData(form))),
        }),
      false,
    );
  }
  async function createHarvest(event: FormEvent<HTMLFormElement>) {
    const form = event.currentTarget;
    await submit(event, () => {
      const values = Object.fromEntries(new FormData(form));
      return api("/harvests", {
        method: "POST",
        body: JSON.stringify({
          ...values,
          honeyMl: Number(values.honeyMl),
          propolisG: Number(values.propolisG),
        }),
      });
    });
  }
  async function createInspection(event: FormEvent<HTMLFormElement>) {
    const form = event.currentTarget;
    await submit(event, async () => {
      const values = Object.fromEntries(new FormData(form));
      const image = await validatedImage(values.image ?? null);
      delete values.image;
      if (!values.status) delete values.status;
      const record = await api<Inspection>("/inspections", {
        method: "POST",
        body: JSON.stringify(values),
      });
      if (image) {
        try {
          await api(`/inspections/${record.id}/photo`, {
            method: "PUT",
            body: image,
            headers: { "Content-Type": image.type },
          });
        } catch (cause) {
          throw new Error(
            `${th.admin.uploadPartial}: ${cause instanceof Error ? cause.message : th.common.retry}`,
          );
        }
      }
    });
  }
  async function uploadInspectionPhoto(
    event: FormEvent<HTMLFormElement>,
    inspectionId: string,
  ) {
    const form = event.currentTarget;
    await submit(event, async () => {
      const image = await validatedImage(new FormData(form).get("image"));
      if (!image) throw new Error(th.admin.photoRequired);
      await api(`/inspections/${inspectionId}/photo`, {
        method: "PUT",
        body: image,
        headers: { "Content-Type": image.type },
      });
    });
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
              <DashboardSummary data={data} />
            </div>
          )}
          <div className="order-1 lg:order-2">
            {section === "hives" &&
              (detailHiveId ? (
                <HiveDetail hiveId={detailHiveId} />
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
                  />
                }
                list={
                  <HarvestList
                    harvests={[...data.harvests, ...extraHarvests]}
                    hiveName={hiveName}
                    hasMore={harvestNextOffset !== null}
                    loadingMore={harvestLoading}
                    loadError={harvestLoadError}
                    onLoadMore={loadMoreHarvests}
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
                  />
                }
                list={
                  <InspectionList
                    inspections={[...data.inspections, ...extraInspections]}
                    hiveName={hiveName}
                    busy={busy}
                    onUpload={uploadInspectionPhoto}
                    savedVersion={savedVersion}
                    hasMore={inspectionNextOffset !== null}
                    loadingMore={inspectionLoading}
                    loadError={inspectionLoadError}
                    onLoadMore={loadMoreInspections}
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
                  <TeamList
                    team={data.team}
                    busy={busy}
                    onToggle={toggleTeam}
                  />
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

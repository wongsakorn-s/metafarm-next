import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  AdminLayout,
  type AdminSection,
} from "../components/layout/AdminLayout";
import { FeaturePanel } from "../components/layout/FeaturePanel";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import { Skeleton } from "../components/ui/Skeleton";
import { Toast, type ToastMessage } from "../components/ui/Toast";
import { HiveForm } from "../features/hives/HiveForm";
import { HiveList } from "../features/hives/HiveList";
import { HarvestForm } from "../features/harvests/HarvestForm";
import { HarvestList } from "../features/harvests/HarvestList";
import { InspectionForm } from "../features/inspections/InspectionForm";
import { InspectionList } from "../features/inspections/InspectionList";
import { TeamForm } from "../features/team/TeamForm";
import { TeamList } from "../features/team/TeamList";
import { th } from "../i18n/th";
import { api, type Dashboard, type Hive, type Inspection } from "../lib/api";
import { farmDate } from "../lib/date";

const sections: AdminSection[] = ["hives", "harvests", "inspections", "team"];

function initialSection(): AdminSection {
  const hash = window.location.hash.slice(1);
  return sections.includes(hash as AdminSection)
    ? (hash as AdminSection)
    : "hives";
}

function validatedImage(value: FormDataEntryValue | null): File | null {
  if (!(value instanceof File) || value.size === 0) return null;
  if (
    value.size > 2_000_000 ||
    !["image/jpeg", "image/png", "image/webp"].includes(value.type)
  ) {
    throw new Error(th.admin.photoInvalid);
  }
  return value;
}

export function AdminPage() {
  const today = farmDate();
  const [data, setData] = useState<Dashboard | null>(null);
  const [section, setSection] = useState<AdminSection>(initialSection);
  const [notice, setNotice] = useState<ToastMessage | null>(null);
  const [loadError, setLoadError] = useState("");
  const [busy, setBusy] = useState(false);
  const [savedVersion, setSavedVersion] = useState(0);
  const closeNotice = useCallback(() => setNotice(null), []);

  useEffect(() => {
    document.title = `${th.admin.farmManagement} | MetaFarm`;
  }, []);
  const refresh = useCallback(async () => {
    setData(await api<Dashboard>("/dashboard"));
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
      const image = validatedImage(values.image ?? null);
      delete values.image;
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
      const image = validatedImage(new FormData(form).get("image"));
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
    } catch (cause) {
      setNotice({
        message:
          cause instanceof Error ? cause.message : th.admin.roleChangeFailed,
        kind: "error",
      });
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
        <>
          <div className="mb-6 grid grid-cols-3 gap-2 sm:gap-4">
            {[
              [th.admin.hiveCount, data.hives.length],
              [th.admin.harvestCount, data.harvests.length],
              [th.admin.inspectionCount, data.inspections.length],
            ].map(([label, value]) => (
              <Card key={label} className="p-3 sm:p-5">
                <p className="text-xs text-stone-600 sm:text-sm">{label}</p>
                <p className="mt-2 text-2xl font-black text-leaf-800 sm:text-4xl">
                  {value}
                </p>
              </Card>
            ))}
          </div>
          {section === "hives" && (
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
          )}
          {section === "harvests" && (
            <FeaturePanel
              title={th.admin.addHarvest}
              actionLabel={th.admin.addHarvest}
              savedVersion={savedVersion}
              form={
                <HarvestForm
                  hives={data.hives}
                  today={today}
                  busy={busy}
                  onSubmit={createHarvest}
                />
              }
              list={
                <HarvestList harvests={data.harvests} hiveName={hiveName} />
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
                  today={today}
                  busy={busy}
                  onSubmit={createInspection}
                />
              }
              list={
                <InspectionList
                  inspections={data.inspections}
                  hiveName={hiveName}
                  busy={busy}
                  onUpload={uploadInspectionPhoto}
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
                <TeamList team={data.team} busy={busy} onToggle={toggleTeam} />
              }
            />
          )}
        </>
      )}
    </AdminLayout>
  );
}

import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { api, type Dashboard, type Hive, type Inspection } from "../lib/api";
import { farmDate } from "../lib/date";

type Section = "hives" | "harvests" | "inspections" | "team";
const statusLabels: Record<string, string> = {
  Strong: "แข็งแรง",
  Normal: "ปกติ",
  Weak: "อ่อนแอ",
  Empty: "รังว่าง",
};
const statuses = Object.keys(statusLabels);

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block text-sm font-semibold">
      {label}
      {children}
    </label>
  );
}

function Card({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-[1.75rem] border border-stone-200 bg-white p-6 shadow-[0_20px_45px_-30px_rgba(68,64,60,0.35)]">
      {children}
    </div>
  );
}

function StatusSelect({ value = "Normal" }: { value?: string }) {
  return (
    <select name="status" defaultValue={value} className="input">
      {statuses.map((status) => (
        <option key={status} value={status}>
          {statusLabels[status]}
        </option>
      ))}
    </select>
  );
}

function validatedImage(value: FormDataEntryValue | null): File | null {
  if (!(value instanceof File) || value.size === 0) return null;
  if (
    value.size > 2_000_000 ||
    !["image/jpeg", "image/png", "image/webp"].includes(value.type)
  ) {
    throw new Error("รูปต้องเป็น JPEG/PNG/WebP และไม่เกิน 2 MB");
  }
  return value;
}

export function AdminPage() {
  const today = farmDate();
  useEffect(() => {
    document.title = "ระบบจัดการฟาร์ม | MetaFarm";
  }, []);
  const [data, setData] = useState<Dashboard | null>(null);
  const [section, setSection] = useState<Section>(() => {
    const value = window.location.hash.slice(1);
    return ["hives", "harvests", "inspections", "team"].includes(value)
      ? (value as Section)
      : "hives";
  });
  const [notice, setNotice] = useState<{
    message: string;
    kind: "success" | "error";
  } | null>(null);
  const [loadError, setLoadError] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    setData(await api<Dashboard>("/dashboard"));
    setLoadError("");
  }, []);
  useEffect(() => {
    refresh().catch((cause: Error) => setLoadError(cause.message));
  }, [refresh]);
  useEffect(() => {
    if (data && data.staff.role !== "owner" && section === "team") {
      setSection("hives");
      window.history.replaceState(null, "", "#hives");
    }
  }, [data, section]);

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
      setNotice({ message: "บันทึกข้อมูลแล้ว", kind: "success" });
      if (resetAfter) form.reset();
    } catch (cause) {
      await refresh().catch(() => undefined);
      setNotice({
        message: cause instanceof Error ? cause.message : "บันทึกไม่สำเร็จ",
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
            `บันทึกการตรวจแล้ว แต่เพิ่มรูปไม่สำเร็จ: ${cause instanceof Error ? cause.message : "ลองอีกครั้ง"}`,
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
      if (!image) throw new Error("กรุณาเลือกรูป");
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
    try {
      await api(`/team/${encodeURIComponent(email)}`, {
        method: "PATCH",
        body: JSON.stringify({ active }),
      });
      await refresh();
      setNotice({ message: "เปลี่ยนสิทธิ์แล้ว", kind: "success" });
    } catch (cause) {
      setNotice({
        message:
          cause instanceof Error ? cause.message : "เปลี่ยนสิทธิ์ไม่สำเร็จ",
        kind: "error",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="admin-shell min-h-screen bg-[#fafaf9] text-stone-900">
      <a href="#main-content" className="skip-link">
        ข้ามไปเนื้อหา
      </a>
      <header className="sticky top-0 z-40 border-b border-stone-200/80 bg-[#fafaf9]/90 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-[88rem] flex-wrap items-center justify-between gap-3 px-5 py-3 md:px-8">
          <div>
            <a href="/" className="inline-block">
              <img
                src="/logo.png"
                alt="MetaFarm หน้าแรก"
                className="h-11 w-auto"
              />
            </a>
            <p className="mt-1 text-xs font-semibold tracking-[.15em] text-amber-700 uppercase">
              Farm management
            </p>
          </div>
          <div className="text-right text-sm">
            <p className="font-semibold">
              {data?.staff.email ??
                (loadError ? "โหลดข้อมูลไม่ได้" : "กำลังตรวจสิทธิ์...")}
            </p>
            <p className="text-stone-500">
              {data
                ? data.staff.role === "owner"
                  ? "เจ้าของฟาร์ม"
                  : "ทีมงาน"
                : ""}
            </p>
          </div>
        </div>
      </header>
      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto max-w-[88rem] px-5 py-10 md:px-8 md:py-14"
      >
        <p className="inline-flex rounded-full bg-amber-100 px-4 py-1.5 text-sm font-bold text-amber-900">
          MetaFarm / Dashboard
        </p>
        <h1 className="mt-5 text-4xl font-black tracking-tight md:text-5xl">
          ภาพรวมฟาร์ม
        </h1>
        <p className="mt-3 text-stone-600">
          ข้อมูลหลังบ้านสำหรับเจ้าของฟาร์มและทีมงาน
        </p>
        {notice && (
          <p
            role={notice.kind === "error" ? "alert" : "status"}
            className={`mt-6 border-l-4 p-4 ${notice.kind === "error" ? "border-red-700 bg-red-50 text-red-900" : "border-[#357451] bg-[#e9f3e8] text-[#173e30]"}`}
          >
            {notice.message}
          </p>
        )}
        {!data ? (
          loadError ? (
            <div
              role="alert"
              className="mt-8 max-w-xl border-l-2 border-[#b7803d] bg-white p-6"
            >
              <p className="font-semibold">โหลดข้อมูลฟาร์มไม่สำเร็จ</p>
              <p className="mt-2 text-sm text-[#607367]">{loadError}</p>
              <button
                type="button"
                onClick={() => {
                  setLoadError("");
                  refresh().catch((cause: Error) =>
                    setLoadError(cause.message),
                  );
                }}
                className="public-button-solid mt-5"
              >
                ลองอีกครั้ง
              </button>
            </div>
          ) : (
            <p className="mt-8">กำลังโหลดข้อมูล...</p>
          )
        ) : (
          <>
            <div className="mt-9 grid gap-4 sm:grid-cols-3">
              <Card>
                <p className="text-sm text-[#607367]">รังทั้งหมด</p>
                <p className="mt-4 text-5xl font-semibold">
                  {data.hives.length}
                </p>
              </Card>
              <Card>
                <p className="text-sm text-[#607367]">บันทึกผลผลิต</p>
                <p className="mt-4 text-5xl font-semibold">
                  {data.harvests.length}
                </p>
              </Card>
              <Card>
                <p className="text-sm text-[#607367]">บันทึกการตรวจ</p>
                <p className="mt-4 text-5xl font-semibold">
                  {data.inspections.length}
                </p>
              </Card>
            </div>
            <nav
              className="mt-10 flex w-fit max-w-full flex-wrap gap-1 rounded-[1.5rem] border border-stone-200 bg-white/90 p-1 shadow-lg shadow-stone-200/40"
              aria-label="ส่วนจัดการ"
            >
              {(
                [
                  { id: "hives", label: "รังผึ้ง" },
                  { id: "harvests", label: "ผลผลิต" },
                  { id: "inspections", label: "การตรวจและรูป" },
                  ...(data.staff.role === "owner"
                    ? [{ id: "team", label: "สมาชิก" }]
                    : []),
                ] as { id: Section; label: string }[]
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setSection(item.id);
                    window.history.replaceState(null, "", `#${item.id}`);
                  }}
                  aria-pressed={section === item.id}
                  className={`min-h-11 rounded-full px-5 py-2.5 text-sm font-bold transition-colors ${section === item.id ? "bg-stone-900 text-white shadow-md" : "text-stone-500 hover:bg-stone-100 hover:text-stone-800"}`}
                >
                  {item.label}
                </button>
              ))}
            </nav>
            {section === "hives" && (
              <div className="mt-6 grid gap-6 lg:grid-cols-[350px_1fr]">
                <form
                  onSubmit={createHive}
                  className="h-fit space-y-4 rounded-2xl bg-white p-6 shadow-sm"
                >
                  <h2 className="text-xl font-bold">เพิ่มรัง</h2>
                  <Field label="รหัสรัง">
                    <input
                      required
                      maxLength={40}
                      name="code"
                      className="input"
                      placeholder="MF-001"
                    />
                  </Field>
                  <Field label="ชื่อรัง">
                    <input
                      required
                      maxLength={100}
                      name="name"
                      className="input"
                    />
                  </Field>
                  <Field label="ชนิดชันโรง">
                    <input maxLength={100} name="species" className="input" />
                  </Field>
                  <Field label="ตำแหน่ง">
                    <input maxLength={200} name="location" className="input" />
                  </Field>
                  <Field label="สถานะ">
                    <StatusSelect />
                  </Field>
                  <button disabled={busy} className="primary">
                    บันทึกรัง
                  </button>
                </form>
                <div className="space-y-3">
                  {data.hives.map((hive) => (
                    <details
                      key={hive.id}
                      className="rounded-2xl bg-white p-5 shadow-sm"
                    >
                      <summary className="cursor-pointer font-bold">
                        {hive.code} · {hive.name}{" "}
                        <span className="ml-2 text-sm font-normal text-slate-500">
                          {statusLabels[hive.status] ?? hive.status}
                        </span>
                      </summary>
                      <form
                        onSubmit={(event) => updateHive(event, hive)}
                        className="mt-5 grid gap-3 sm:grid-cols-2"
                      >
                        <Field label="ชื่อรัง">
                          <input
                            required
                            maxLength={100}
                            name="name"
                            defaultValue={hive.name}
                            className="input"
                          />
                        </Field>
                        <Field label="ชนิดชันโรง">
                          <input
                            maxLength={100}
                            name="species"
                            defaultValue={hive.species ?? ""}
                            className="input"
                          />
                        </Field>
                        <Field label="ตำแหน่ง">
                          <input
                            maxLength={200}
                            name="location"
                            defaultValue={hive.location ?? ""}
                            className="input"
                          />
                        </Field>
                        <Field label="สถานะ">
                          <StatusSelect value={hive.status} />
                        </Field>
                        <button
                          disabled={busy}
                          className="primary sm:col-span-2"
                        >
                          บันทึกการแก้ไข
                        </button>
                      </form>
                    </details>
                  ))}
                  {!data.hives.length && (
                    <Card>
                      <p className="font-semibold">ยังไม่มีรังในระบบ</p>
                      <p className="mt-2 text-sm leading-7 text-[#607367]">
                        เริ่มจากกรอกข้อมูลรังในแบบฟอร์มด้านซ้าย
                        แล้วจึงบันทึกผลผลิตและการตรวจได้
                      </p>
                    </Card>
                  )}
                </div>
              </div>
            )}
            {section === "harvests" && (
              <div className="mt-6 grid gap-6 lg:grid-cols-[350px_1fr]">
                <form
                  onSubmit={createHarvest}
                  className="h-fit space-y-4 rounded-2xl bg-white p-6 shadow-sm"
                >
                  <h2 className="text-xl font-bold">บันทึกผลผลิต</h2>
                  <Field label="รัง">
                    <select required name="hiveId" className="input">
                      <option value="">เลือกรัง</option>
                      {data.hives.map((hive) => (
                        <option value={hive.id} key={hive.id}>
                          {hive.code} · {hive.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="วันที่เก็บ">
                    <input
                      required
                      type="date"
                      name="harvestedAt"
                      defaultValue={today}
                      className="input"
                    />
                  </Field>
                  <Field label="น้ำผึ้ง (มล.)">
                    <input
                      required
                      type="number"
                      min="0"
                      max="1000000"
                      step="1"
                      name="honeyMl"
                      defaultValue="0"
                      className="input"
                    />
                  </Field>
                  <Field label="พรอพอลิส (กรัม)">
                    <input
                      required
                      type="number"
                      min="0"
                      max="1000000"
                      step="0.01"
                      name="propolisG"
                      defaultValue="0"
                      className="input"
                    />
                  </Field>
                  <button
                    disabled={busy || !data.hives.length}
                    className="primary"
                  >
                    บันทึกผลผลิต
                  </button>
                  {!data.hives.length && (
                    <p className="text-sm text-[#855517]">
                      ต้องเพิ่มรังชันโรงก่อนบันทึกผลผลิต
                    </p>
                  )}
                </form>
                <Card>
                  <h2 className="mb-4 text-xl font-bold">รายการล่าสุด</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-130 text-left text-sm">
                      <thead className="border-b text-slate-500">
                        <tr>
                          <th className="py-3">วันที่</th>
                          <th>รัง</th>
                          <th>น้ำผึ้ง</th>
                          <th>พรอพอลิส</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.harvests.map((record) => (
                          <tr
                            key={record.id}
                            className="border-b border-slate-100"
                          >
                            <td className="py-3">{record.harvestedAt}</td>
                            <td>{hiveName(record.hiveId)}</td>
                            <td>{record.honeyMl} มล.</td>
                            <td>{record.propolisG} กรัม</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {!data.harvests.length && (
                      <p className="py-6 text-slate-500">ยังไม่มีบันทึก</p>
                    )}
                  </div>
                </Card>
              </div>
            )}
            {section === "inspections" && (
              <div className="mt-6 grid gap-6 lg:grid-cols-[350px_1fr]">
                <form
                  onSubmit={createInspection}
                  className="h-fit space-y-4 rounded-2xl bg-white p-6 shadow-sm"
                >
                  <h2 className="text-xl font-bold">บันทึกการตรวจ</h2>
                  <Field label="รัง">
                    <select required name="hiveId" className="input">
                      <option value="">เลือกรัง</option>
                      {data.hives.map((hive) => (
                        <option value={hive.id} key={hive.id}>
                          {hive.code} · {hive.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="วันที่ตรวจ">
                    <input
                      required
                      type="date"
                      name="inspectedAt"
                      defaultValue={today}
                      className="input"
                    />
                  </Field>
                  <Field label="สถานะ">
                    <StatusSelect />
                  </Field>
                  <Field label="บันทึก">
                    <textarea
                      name="notes"
                      maxLength={2000}
                      rows={4}
                      className="input"
                    />
                  </Field>
                  <Field label="รูป (ไม่เกิน 2 MB)">
                    <input
                      type="file"
                      name="image"
                      accept="image/jpeg,image/png,image/webp"
                      className="input"
                    />
                  </Field>
                  <button
                    disabled={busy || !data.hives.length}
                    className="primary"
                  >
                    บันทึกการตรวจ
                  </button>
                  {!data.hives.length && (
                    <p className="text-sm text-[#855517]">
                      ต้องเพิ่มรังชันโรงก่อนบันทึกการตรวจ
                    </p>
                  )}
                </form>
                <div className="space-y-3">
                  {data.inspections.map((record) => (
                    <article
                      key={record.id}
                      className="rounded-2xl bg-white p-5 shadow-sm"
                    >
                      <p className="font-bold">
                        {hiveName(record.hiveId)}{" "}
                        <span className="text-sm font-normal text-slate-500">
                          · {record.inspectedAt}
                        </span>
                      </p>
                      <p className="mt-2 text-sm text-emerald-800">
                        สถานะ: {statusLabels[record.status] ?? record.status}
                      </p>
                      {record.notes && (
                        <p className="mt-2 whitespace-pre-wrap text-slate-600">
                          {record.notes}
                        </p>
                      )}
                      {record.imageKey && (
                        <a
                          href={`/api/inspections/${record.id}/photo`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 inline-block font-semibold text-emerald-800 underline"
                        >
                          ดูรูปถ่าย
                        </a>
                      )}
                      <form
                        onSubmit={(event) =>
                          uploadInspectionPhoto(event, record.id)
                        }
                        className="mt-4 flex flex-wrap items-end gap-3"
                      >
                        <Field label="รูป (ไม่เกิน 2 MB)">
                          <input
                            required
                            type="file"
                            name="image"
                            accept="image/jpeg,image/png,image/webp"
                            className="input"
                          />
                        </Field>
                        <button disabled={busy} className="primary">
                          {record.imageKey ? "เปลี่ยนรูป" : "แนบรูป"}
                        </button>
                      </form>
                    </article>
                  ))}
                  {!data.inspections.length && <Card>ยังไม่มีบันทึก</Card>}
                </div>
              </div>
            )}
            {section === "team" && data.staff.role === "owner" && (
              <div className="mt-6 grid gap-6 lg:grid-cols-[350px_1fr]">
                <form
                  onSubmit={createTeam}
                  className="h-fit space-y-4 rounded-2xl bg-white p-6 shadow-sm"
                >
                  <h2 className="text-xl font-bold">เพิ่มทีมงาน</h2>
                  <Field label="อีเมล">
                    <input
                      required
                      type="email"
                      maxLength={254}
                      name="email"
                      className="input"
                    />
                  </Field>
                  <button disabled={busy} className="primary">
                    เพิ่มสิทธิ์
                  </button>
                  <p className="text-sm text-slate-500">
                    ต้องเพิ่มอีเมลเดียวกันใน Cloudflare Access policy ด้วย
                  </p>
                </form>
                <div className="space-y-3">
                  {data.team.map((member) => (
                    <div
                      key={member.email}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-5 shadow-sm"
                    >
                      <div>
                        <p className="font-semibold">{member.email}</p>
                        <p className="text-sm text-slate-500">
                          {member.active ? "ใช้งานอยู่" : "ปิดสิทธิ์แล้ว"}
                        </p>
                      </div>
                      <button
                        disabled={busy}
                        onClick={() => toggleTeam(member.email, !member.active)}
                        className="rounded-lg border border-emerald-700 px-4 py-2 text-sm font-semibold text-emerald-900"
                      >
                        {member.active ? "ปิดสิทธิ์" : "เปิดสิทธิ์"}
                      </button>
                    </div>
                  ))}
                  {!data.team.length && <Card>ยังไม่มีทีมงาน</Card>}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

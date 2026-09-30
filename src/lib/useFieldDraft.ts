import { useEffect, useRef, useState, type FormEvent } from "react";
import { th } from "../i18n/th";

type DraftKind = "harvest" | "inspection";

function storageKey(kind: DraftKind, email: string, hiveId: string) {
  return `metafarm:draft:v1:${kind}:${email.toLowerCase()}:${hiveId}`;
}

function lastHiveKey(kind: DraftKind, email: string) {
  return `metafarm:draft:last-hive:v1:${kind}:${email.toLowerCase()}`;
}

function hiveFromForm(form: HTMLFormElement) {
  return String(new FormData(form).get("hiveId") ?? "");
}

export function useFieldDraft(kind: DraftKind, email?: string, initialHiveId?: string) {
  const formRef = useRef<HTMLFormElement>(null);
  const previousHiveId = useRef(initialHiveId ?? "");
  const [hasDraft, setHasDraft] = useState(false);
  const [error, setError] = useState("");

  function restore(form: HTMLFormElement, hiveId: string) {
    if (!email || !hiveId) return false;
    try {
      const raw = localStorage.getItem(storageKey(kind, email, hiveId));
      if (!raw) return false;
      const values = JSON.parse(raw) as Record<string, unknown>;
      for (const [name, value] of Object.entries(values)) {
        if (name === "image" || name === "hiveId" || typeof value !== "string") continue;
        const field = form.elements.namedItem(name);
        if (field instanceof HTMLInputElement || field instanceof HTMLSelectElement ||
          field instanceof HTMLTextAreaElement) field.value = value;
      }
      setHasDraft(true);
      return true;
    } catch {
      setError(th.admin.draftUnavailable);
      return false;
    }
  }

  useEffect(() => {
    const form = formRef.current;
    if (!form || !email) return;
    let hiveId = initialHiveId;
    if (!hiveId) {
      try {
        const lastHive = localStorage.getItem(lastHiveKey(kind, email));
        const field = form.elements.namedItem("hiveId");
        if (lastHive && field instanceof HTMLSelectElement &&
          Array.from(field.options).some((option) => option.value === lastHive)) {
          field.value = lastHive;
          hiveId = lastHive;
        }
      } catch {
        setError(th.admin.draftUnavailable);
      }
    }
    if (hiveId) {
      previousHiveId.current = hiveId;
      restore(form, hiveId);
    }
  }, [email, initialHiveId, kind]);

  function onInput(event: FormEvent<HTMLFormElement>) {
    const form = event.currentTarget;
    const target = event.target as HTMLInputElement;
    if (target.name === "image" || !email) return;
    const hiveId = hiveFromForm(form);
    if (!hiveId) return;
    if (target.name === "hiveId" && previousHiveId.current !== hiveId) {
      previousHiveId.current = hiveId;
      try {
        localStorage.setItem(lastHiveKey(kind, email), hiveId);
      } catch {
        setError(th.admin.draftUnavailable);
      }
      const selected = form.elements.namedItem("hiveId");
      form.reset();
      if (selected instanceof HTMLSelectElement) selected.value = hiveId;
      setHasDraft(restore(form, hiveId));
      return;
    }
    previousHiveId.current = hiveId;
    try {
      const values: Record<string, string> = {};
      for (const [name, value] of new FormData(form)) {
        if (name !== "image" && typeof value === "string") values[name] = value;
      }
      localStorage.setItem(storageKey(kind, email, hiveId), JSON.stringify(values));
      setHasDraft(true);
      setError("");
    } catch {
      setError(th.admin.draftUnavailable);
    }
  }

  function clear() {
    const form = formRef.current;
    if (!form || !email) return;
    const hiveId = previousHiveId.current || hiveFromForm(form);
    if (!hiveId) return;
    try {
      localStorage.removeItem(storageKey(kind, email, hiveId));
      setHasDraft(false);
      setError("");
    } catch {
      setError(th.admin.draftUnavailable);
    }
  }

  return { formRef, hasDraft, error, onInput, clear };
}

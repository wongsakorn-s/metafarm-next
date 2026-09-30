import { useEffect, useRef, useState } from "react";
import { Button } from "../../components/ui/Button";
import { Field } from "../../components/ui/Field";
import { th } from "../../i18n/th";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxSourceBytes = 10_000_000;

export function PhotoUpload({ required = false }: { required?: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [selected, setSelected] = useState<File | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    const form = inputRef.current?.form;
    if (!form) return;
    const clear = () => {
      inputRef.current?.setCustomValidity("");
      setPreview(null);
      setSelected(null);
      setError("");
    };
    form.addEventListener("reset", clear);
    return () => form.removeEventListener("reset", clear);
  }, []);
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );
  return (
    <Field label={th.admin.photo} required={required} hint={th.admin.photoHint}>
      {(id) => (
        <>
          <input
            ref={inputRef}
            id={id}
            className="sr-only"
            required={required}
            type="file"
            name="image"
            accept="image/jpeg,image/png,image/webp"
            aria-invalid={Boolean(error)}
            onChange={(event) => {
              const input = event.currentTarget;
              const file = input.files?.[0] ?? null;
              const issue =
                file && (!allowedTypes.has(file.type) || file.size === 0)
                  ? th.common.imageTypeInvalid
                  : file && file.size > maxSourceBytes
                    ? th.common.imageSourceTooLarge
                    : "";
              input.setCustomValidity(issue);
              setSelected(file);
              setError(issue);
              setPreview(file && !issue ? URL.createObjectURL(file) : null);
            }}
          />
          <Button variant="outline" className="mt-2" onClick={() => inputRef.current?.click()}>
            {th.admin.choosePhoto}
          </Button>
          {selected && (
            <p className="mt-2 break-words text-sm text-stone-700">
              {th.admin.selectedPhoto}: {selected.name} ({(selected.size / 1_000_000).toLocaleString("th-TH", { maximumFractionDigits: 2 })} MB)
            </p>
          )}
          {error && <p role="alert" className="mt-2 text-sm text-danger-700">{error}</p>}
          {preview && (
            <img
              src={preview}
              alt={th.admin.photoPreview}
              className="mt-3 max-h-52 w-full rounded-control object-contain"
            />
          )}
        </>
      )}
    </Field>
  );
}

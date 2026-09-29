import { useEffect, useState } from "react";
import { Field } from "../../components/ui/Field";
import { Input } from "../../components/ui/Input";
import { th } from "../../i18n/th";

export function PhotoUpload({ required = false }: { required?: boolean }) {
  const [preview, setPreview] = useState<string | null>(null);
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
          <Input
            id={id}
            required={required}
            type="file"
            name="image"
            accept="image/jpeg,image/png,image/webp"
            capture="environment"
            onChange={(event) => {
              const file = event.currentTarget.files?.[0];
              setPreview(file ? URL.createObjectURL(file) : null);
            }}
          />
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

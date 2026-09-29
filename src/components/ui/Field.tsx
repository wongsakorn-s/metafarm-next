import { useId, type ReactNode } from "react";

type Props = {
  label: string;
  children: (id: string) => ReactNode;
  hint?: string;
  required?: boolean;
};

export function Field({ label, children, hint, required = false }: Props) {
  const id = useId();
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-sm font-semibold text-stone-800"
      >
        {label}
        {required && (
          <span className="ml-1 text-danger-700" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {children(id)}
      {hint && <p className="mt-1 text-xs text-stone-600">{hint}</p>}
    </div>
  );
}

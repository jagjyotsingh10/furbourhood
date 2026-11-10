import type { ComponentProps, ReactNode } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface FieldProps extends ComponentProps<"input"> {
  id: string;
  label: string;
  hint?: string;
  error?: string;
}

/** Labelled text input with an optional hint and inline error. */
export function Field({ id, label, hint, error, className, ...input }: FieldProps) {
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} aria-invalid={error ? true : undefined} aria-describedby={describedBy} {...input} />
      {error ? (
        <p id={`${id}-error`} className="text-xs text-destructive">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="text-xs text-muted-foreground">
            {hint}
          </p>
        )
      )}
    </div>
  );
}

/** Form-level error, announced to screen readers. */
export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-control border border-destructive bg-card px-3 py-2 text-sm text-destructive">
      {message}
    </p>
  );
}

export interface Choice<T extends string> {
  value: T;
  label: string;
  icon?: ReactNode;
}

interface ChoiceGroupProps<T extends string> {
  name: string;
  legend: string;
  options: Choice<T>[];
  value: T;
  onChange: (value: T) => void;
  columns?: 2 | 4;
}

/** Single choice as real radio buttons (arrow keys work), styled as tiles. Selected = sky fill, navy text. */
export function ChoiceGroup<T extends string>({ name, legend, options, value, onChange, columns = 2 }: ChoiceGroupProps<T>) {
  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="mb-1.5 text-sm font-semibold">{legend}</legend>
      <div className={cn("grid gap-2", columns === 4 ? "grid-cols-4" : "grid-cols-2")}>
        {options.map((option) => (
          <label
            key={option.value}
            className="flex h-11 cursor-pointer items-center justify-center gap-2 rounded-control border border-input bg-card px-2 text-sm font-semibold has-checked:border-navy has-checked:bg-sky has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ring"
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="sr-only"
            />
            {option.icon}
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

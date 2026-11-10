import { Check } from "lucide-react";

import { NEED_LABELS } from "@/lib/catalog";
import type { CareNeed } from "@/types";

const ALL_NEEDS = Object.keys(NEED_LABELS) as CareNeed[];

interface NeedPickerProps {
  value: CareNeed[];
  onChange: (needs: CareNeed[]) => void;
}

/** Pick a pet's care needs. Real checkboxes, styled like NeedChip (square corners), sky fill when chosen. */
export function NeedPicker({ value, onChange }: NeedPickerProps) {
  const toggle = (need: CareNeed) =>
    onChange(value.includes(need) ? value.filter((n) => n !== need) : [...value, need]);

  return (
    <fieldset>
      <legend className="mb-1 text-sm font-semibold">Care needs</legend>
      <p className="mb-2 text-xs text-muted-foreground">We use these to match providers with the right skills.</p>
      <div className="flex flex-wrap gap-2">
        {ALL_NEEDS.map((need) => {
          const checked = value.includes(need);
          return (
            <label
              key={need}
              className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-sm border border-input bg-card px-2.5 text-sm font-medium has-checked:border-navy has-checked:bg-sky has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ring"
            >
              <input type="checkbox" checked={checked} onChange={() => toggle(need)} className="sr-only" />
              {checked && <Check className="size-3.5" aria-hidden />}
              {NEED_LABELS[need]}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

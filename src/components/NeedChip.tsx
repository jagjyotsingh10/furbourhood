import { NEED_LABELS } from "@/lib/catalog";
import { cn } from "@/lib/utils";
import type { CareNeed } from "@/types";

/** A pet's care need. Square-ish so it never reads as a skill-level badge. */
export function NeedChip({ need, className }: { need: CareNeed; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm border border-sky bg-sky-tint px-2 py-1 text-xs font-medium text-navy",
        className,
      )}
    >
      {NEED_LABELS[need]}
    </span>
  );
}

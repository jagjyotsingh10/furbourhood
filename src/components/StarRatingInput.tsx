import { Star } from "lucide-react";

import { cn } from "@/lib/utils";

const LABELS = ["", "Poor", "Fair", "Good", "Very good", "Excellent"];

/** 1 to 5 stars as real radio buttons (arrow keys work). Chosen stars fill coral. */
export function StarRatingInput({ value, onChange }: { value: number; onChange: (rating: number) => void }) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-semibold">Rating</legend>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <label
            key={n}
            className="cursor-pointer rounded-sm p-1 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ring"
          >
            <input
              type="radio"
              name="rating"
              value={n}
              checked={value === n}
              onChange={() => onChange(n)}
              className="sr-only"
              aria-label={`${n} star${n === 1 ? "" : "s"}, ${LABELS[n]}`}
            />
            <Star
              aria-hidden
              className={cn("size-8", n <= value ? "fill-coral text-coral" : "text-input")}
            />
          </label>
        ))}
        <span className="ml-2 text-sm text-muted-foreground" aria-hidden>
          {value > 0 ? LABELS[value] : "Tap to rate"}
        </span>
      </div>
    </fieldset>
  );
}

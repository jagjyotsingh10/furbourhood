import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { todayISO } from "@/lib/format";
import { cn } from "@/lib/utils";

/** How far ahead providers can block dates and owners can look. */
const MONTHS_AHEAD = 6;

const monthTitle = new Intl.DateTimeFormat("en-CA", { month: "long", year: "numeric", timeZone: "UTC" });
const dayName = new Intl.DateTimeFormat("en-CA", { weekday: "long", month: "long", day: "numeric", timeZone: "UTC" });
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function iso(year: number, month: number, day: number) {
  return new Date(Date.UTC(year, month, day)).toISOString().slice(0, 10);
}

interface AvailabilityCalendarProps {
  /** Blocked dates, yyyy-mm-dd */
  blocked: string[];
  /** When given, days are buttons that block / unblock. Otherwise the calendar is read-only. */
  onToggle?: (day: string) => void;
  /** Dates to outline, e.g. the owner's search dates */
  range?: { from: string; to: string };
}

/**
 * Month calendar of blocked dates. Blocked = coral tint, crossed out; the owner's dates = sky outline.
 * Past days can't be changed.
 */
export function AvailabilityCalendar({ blocked, onToggle, range }: AvailabilityCalendarProps) {
  const today = todayISO();
  const [y0, m0] = today.split("-").map(Number) as [number, number];
  const [offset, setOffset] = useState(() => {
    // Open on the month of the owner's dates when they're given and in range.
    if (!range) return 0;
    const [ry, rm] = range.from.split("-").map(Number) as [number, number];
    const diff = (ry - y0) * 12 + (rm - m0);
    return diff >= 0 && diff < MONTHS_AHEAD ? diff : 0;
  });

  const first = new Date(Date.UTC(y0, m0 - 1 + offset, 1));
  const year = first.getUTCFullYear();
  const month = first.getUTCMonth();
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const leading = first.getUTCDay();
  const blockedSet = new Set(blocked);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Previous month"
          disabled={offset === 0}
          onClick={() => setOffset((o) => o - 1)}
        >
          <ChevronLeft className="size-5!" aria-hidden />
        </Button>
        <p className="font-heading text-base font-bold" aria-live="polite">
          {monthTitle.format(first)}
        </p>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Next month"
          disabled={offset >= MONTHS_AHEAD - 1}
          onClick={() => setOffset((o) => o + 1)}
        >
          <ChevronRight className="size-5!" aria-hidden />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center" aria-hidden>
        {WEEKDAYS.map((d) => (
          <span key={d} className="text-xs font-semibold text-muted-foreground">
            {d}
          </span>
        ))}
      </div>

      <ul className="mt-1 grid grid-cols-7 gap-1">
        {Array.from({ length: leading }, (_, i) => (
          <li key={`blank-${i}`} aria-hidden />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = iso(year, month, i + 1);
          const past = day < today;
          const isBlocked = blockedSet.has(day);
          const inRange = range ? day >= range.from && day <= range.to : false;
          const label = `${dayName.format(new Date(`${day}T00:00:00Z`))}${isBlocked ? ", unavailable" : past ? "" : ", available"}${inRange ? ", your dates" : ""}`;
          const look = cn(
            "flex h-10 w-full items-center justify-center rounded-[10px] border text-sm",
            past && "border-transparent text-muted-foreground opacity-50",
            !past && !isBlocked && "border-border bg-card",
            isBlocked && "border-coral bg-coral-tint font-semibold line-through",
            inRange && "ring-2 ring-navy ring-offset-1",
            day === today && "font-bold underline underline-offset-2",
          );
          return (
            <li key={day}>
              {onToggle && !past ? (
                <button
                  type="button"
                  aria-pressed={isBlocked}
                  aria-label={label}
                  onClick={() => onToggle(day)}
                  className={cn(look, "hover:border-navy")}
                >
                  {i + 1}
                </button>
              ) : (
                <span className={look} aria-label={label} role="img">
                  {i + 1}
                </span>
              )}
            </li>
          );
        })}
      </ul>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded-sm border border-border bg-card" aria-hidden />
          Available
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded-sm border border-coral bg-coral-tint" aria-hidden />
          Unavailable
        </span>
        {range && (
          <span className="flex items-center gap-1.5">
            <span className="size-3 rounded-sm ring-2 ring-navy" aria-hidden />
            Your dates
          </span>
        )}
      </div>
    </div>
  );
}

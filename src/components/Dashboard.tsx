import type { ReactNode } from "react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/** One headline number. Not a chart: the number is the message. */
export function StatTile({ label, value, detail, className }: { label: string; value: ReactNode; detail?: string; className?: string }) {
  return (
    <Card className={cn("flex flex-col gap-0.5 p-4", className)}>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="font-heading text-2xl leading-tight font-extrabold">{value}</p>
      {detail && <p className="text-xs text-muted-foreground">{detail}</p>}
    </Card>
  );
}

export interface BarItem {
  label: string;
  value: number;
}

/**
 * Single-series horizontal bars: one hue (navy), every bar labelled with its name and value,
 * so nothing depends on colour and the list doubles as the data table. Sorted largest first.
 */
export function BarList({ title, items, unit, empty = "Nothing yet." }: { title: string; items: BarItem[]; unit: string; empty?: string }) {
  const rows = [...items].filter((i) => i.value > 0).sort((a, b) => b.value - a.value);
  const max = Math.max(1, ...rows.map((r) => r.value));
  const total = rows.reduce((sum, r) => sum + r.value, 0);

  return (
    <Card className="p-4">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-heading text-base font-bold">{title}</h3>
        <p className="text-sm text-muted-foreground">
          {total} {unit}
        </p>
      </div>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">{empty}</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-2.5">
          {rows.map((r) => {
            const share = Math.round((100 * r.value) / total);
            return (
              <li key={r.label} title={`${r.label}: ${r.value} ${unit} (${share}%)`}>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span>{r.label}</span>
                  <span className="font-semibold tabular-nums">
                    {r.value}
                    <span className="sr-only">
                      {" "}
                      {unit}, {share}%
                    </span>
                  </span>
                </div>
                <div className="mt-1 h-2 rounded-[4px] bg-sky-tint" aria-hidden>
                  <div className="h-2 rounded-[4px] bg-navy" style={{ width: `${(100 * r.value) / max}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

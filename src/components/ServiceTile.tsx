import type { ServiceInfo } from "@/lib/catalog";
import { cn } from "@/lib/utils";

interface ServiceTileProps {
  service: ServiceInfo;
  selected?: boolean;
  onSelect?: () => void;
}

export function ServiceTile({ service, selected = false, onSelect }: ServiceTileProps) {
  const Icon = service.icon;
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={cn(
        "flex min-h-24 flex-col items-center justify-center gap-2 rounded-card border-2 px-2 py-3 text-center shadow-card transition-colors",
        selected ? "border-navy bg-sky text-navy" : "border-transparent bg-card text-navy hover:border-sky",
      )}
    >
      <span
        className={cn(
          "flex size-10 items-center justify-center rounded-full",
          selected ? "bg-white/70" : "bg-sky-tint",
        )}
      >
        <Icon className="size-5" aria-hidden />
      </span>
      <span className="text-sm leading-tight font-semibold">{service.label}</span>
    </button>
  );
}

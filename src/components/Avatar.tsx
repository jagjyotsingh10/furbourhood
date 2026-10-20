import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { BrandTone } from "@/types";

const TONES: Record<BrandTone, string> = {
  navy: "bg-navy text-white",
  sky: "bg-sky text-navy",
  mint: "bg-mint text-navy",
  coral: "bg-coral text-navy",
};

const SIZES = {
  sm: "size-8 text-xs",
  md: "size-11 text-sm",
  lg: "size-14 text-lg",
  xl: "size-20 text-2xl",
};

interface AvatarProps {
  name: string;
  tone: BrandTone;
  size?: keyof typeof SIZES;
  className?: string;
}

/** Initials avatar in a brand colour. Used for people and pets; no photos. */
export function Avatar({ name, tone, size = "md", className }: AvatarProps) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-heading font-extrabold select-none",
        TONES[tone],
        SIZES[size],
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}

import { CircleCheck, Clock, CreditCard, ShieldCheck, Sparkles, Star, ThumbsUp } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { STATUS_LABELS } from "@/lib/catalog";
import { cn } from "@/lib/utils";
import type { BookingStatus } from "@/types";

export function VerifiedBadge({ className }: { className?: string }) {
  return (
    <Badge variant="sky" className={className}>
      <ShieldCheck aria-hidden />
      Verified in person
    </Badge>
  );
}

/** Only shown on the All providers list, never on Best match. */
export function FeaturedBadge({ className }: { className?: string }) {
  return (
    <Badge variant="coral" className={className}>
      <Sparkles aria-hidden />
      Featured
    </Badge>
  );
}

const STATUS = {
  requested: { variant: "outline", icon: Clock },
  accepted: { variant: "sky", icon: ThumbsUp },
  paid: { variant: "navy", icon: CreditCard },
  completed: { variant: "mint", icon: CircleCheck },
} as const;

export function StatusChip({ status, className }: { status: BookingStatus; className?: string }) {
  const { variant, icon: Icon } = STATUS[status];
  return (
    <Badge variant={variant} className={className}>
      <Icon aria-hidden />
      {STATUS_LABELS[status]}
    </Badge>
  );
}

export function Rating({ rating, reviewCount, className }: { rating: number; reviewCount?: number; className?: string }) {
  const label =
    reviewCount === undefined
      ? `Rated ${rating.toFixed(1)} out of 5`
      : `Rated ${rating.toFixed(1)} out of 5 from ${reviewCount} reviews`;
  return (
    <span className={cn("inline-flex items-center gap-1 text-sm", className)} aria-label={label} role="img">
      <Star className="size-4 fill-coral text-coral" aria-hidden />
      <span className="font-semibold text-navy">{rating.toFixed(1)}</span>
      {reviewCount !== undefined && <span className="text-muted-foreground">({reviewCount})</span>}
    </span>
  );
}

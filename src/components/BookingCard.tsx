import { Link } from "react-router-dom";
import { CalendarDays } from "lucide-react";

import { Avatar } from "@/components/Avatar";
import { StatusChip } from "@/components/Badges";
import { Card } from "@/components/ui/card";
import { serviceInfo } from "@/lib/catalog";
import { formatDateRange, formatPrice } from "@/lib/format";
import type { Booking, Pet, Provider } from "@/types";

interface BookingCardProps {
  booking: Booking;
  provider: Provider;
  pet: Pet;
}

export function BookingCard({ booking, provider, pet }: BookingCardProps) {
  return (
    <Card className="relative p-4">
      <div className="flex items-start gap-3">
        <Avatar name={provider.name} tone={provider.tone} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-heading text-base leading-tight font-bold">
              <Link
                to={`/providers/${provider.id}`}
                className="after:absolute after:inset-0 after:rounded-card focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-ring"
              >
                {serviceInfo(booking.service).label}
              </Link>
            </h3>
            <StatusChip status={booking.status} />
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">
            with {provider.name} · for {pet.name}
          </p>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between border-t pt-3 text-sm">
        <span className="flex items-center gap-1.5">
          <CalendarDays className="size-4" aria-hidden />
          {formatDateRange(booking.start, booking.end)}
        </span>
        <span className="font-bold">{formatPrice(booking.total)}</span>
      </div>
    </Card>
  );
}

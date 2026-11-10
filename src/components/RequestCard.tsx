import { useState } from "react";
import { CalendarDays, CircleCheck } from "lucide-react";

import { Avatar } from "@/components/Avatar";
import { StatusChip } from "@/components/Badges";
import { FormError } from "@/components/Field";
import { NeedChip } from "@/components/NeedChip";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { RequestDetails } from "@/data/api";
import { serviceInfo } from "@/lib/catalog";
import { formatDateRange, formatPrice, plural } from "@/lib/format";
import type { Provider } from "@/types";

interface RequestCardProps {
  request: RequestDetails;
  listing: Provider;
  /** Called with the answer; the card shows its own busy and error states. */
  onAnswer?: (answer: "accepted" | "declined") => Promise<void>;
}

/** A booking request as the provider sees it: who, which pet and its needs, when, how much. */
export function RequestCard({ request, listing, onAnswer }: RequestCardProps) {
  const { booking, pet, ownerName } = request;
  const [confirmDecline, setConfirmDecline] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const covered = pet.needs.filter((need) => listing.skills.some((s) => s.need === need));

  const answer = async (value: "accepted" | "declined") => {
    if (!onAnswer) return;
    setBusy(true);
    setError(null);
    try {
      await onAnswer(value);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your answer. Try again.");
      setBusy(false);
    }
  };

  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <Avatar name={pet.name} tone={pet.tone} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-heading text-base leading-tight font-bold">{serviceInfo(booking.service).label}</h3>
            <StatusChip status={booking.status} />
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">
            for {pet.name} ({pet.species.toLowerCase()}{pet.breed && `, ${pet.breed}`}) · from {ownerName}
          </p>
        </div>
      </div>

      {pet.needs.length > 0 && (
        <div className="mt-3 rounded-control bg-cloud p-3">
          <p className="flex items-center gap-1.5 text-sm font-semibold">
            <CircleCheck className="size-4" aria-hidden />
            Your skills cover {covered.length} of {pet.name}'s {plural(pet.needs.length, "need")}
          </p>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {pet.needs.map((need) => (
              <li key={need}>
                <NeedChip need={need} />
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-3 flex items-center justify-between border-t pt-3 text-sm">
        <span className="flex items-center gap-1.5">
          <CalendarDays className="size-4" aria-hidden />
          {formatDateRange(booking.start, booking.end)}
        </span>
        <span className="font-bold">{formatPrice(booking.total)}</span>
      </div>

      {onAnswer && booking.status === "requested" && (
        <div className="mt-3 flex flex-col gap-2">
          <FormError message={error} />
          {confirmDecline ? (
            <div className="flex flex-col gap-2 rounded-control bg-coral-tint p-3">
              <p className="text-sm font-semibold">Decline this request? {ownerName} will see it as Declined.</p>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" onClick={() => setConfirmDecline(false)} disabled={busy}>
                  Back
                </Button>
                <Button variant="destructive" size="sm" onClick={() => answer("declined")} disabled={busy}>
                  {busy ? "Declining…" : "Decline"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={() => setConfirmDecline(true)} disabled={busy}>
                Decline
              </Button>
              <Button onClick={() => answer("accepted")} disabled={busy}>
                {busy ? "Accepting…" : "Accept"}
              </Button>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

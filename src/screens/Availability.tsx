import { useState } from "react";
import { CircleCheck } from "lucide-react";

import { useAuth } from "@/auth/AuthProvider";
import { AppBar } from "@/components/AppBar";
import { ScreenBody } from "@/components/AppShell";
import { AvailabilityCalendar } from "@/components/AvailabilityCalendar";
import { FormError } from "@/components/Field";
import { EmptyState, ErrorState, LoadingState } from "@/components/States";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { saveUnavailableDates } from "@/data/api";
import { useMyListing } from "@/data/hooks";
import { formatDate, plural } from "@/lib/format";
import type { Provider } from "@/types";

function AvailabilityEditor({
  listing,
  onSaved,
  onEdit,
}: {
  listing: Provider;
  onSaved: () => void;
  onEdit: () => void;
}) {
  const [blocked, setBlocked] = useState<string[]>(listing.unavailable);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const changed =
    blocked.length !== listing.unavailable.length || blocked.some((d) => !listing.unavailable.includes(d));

  const toggle = (day: string) => {
    onEdit();
    setBlocked((current) => (current.includes(day) ? current.filter((d) => d !== day) : [...current, day].sort()));
  };

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      await saveUnavailableDates(listing.id, listing.unavailable, blocked);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save. Try again.");
    }
    setBusy(false);
  };

  return (
    <>
      <p className="text-sm text-muted-foreground">
        Tap the dates you can't take bookings. Owners won't see you in search for those dates, and requests that
        include them are turned away.
      </p>
      <Card className="p-4">
        <AvailabilityCalendar blocked={blocked} onToggle={toggle} />
      </Card>
      <Card className="p-4">
        <p className="text-sm font-semibold">
          {blocked.length === 0 ? "No dates blocked" : `${plural(blocked.length, "date")} blocked`}
        </p>
        {blocked.length > 0 && (
          <p className="mt-1 text-sm text-muted-foreground">{blocked.map((d) => formatDate(d)).join(" · ")}</p>
        )}
      </Card>
      <FormError message={error} />
      <Button size="lg" onClick={save} disabled={busy || !changed}>
        {busy ? "Saving…" : "Save availability"}
      </Button>
    </>
  );
}

export function Availability() {
  const { role } = useAuth();
  const { data: listing, loading, error, reload } = useMyListing();
  // Lives here, not in the editor, because the editor remounts after each save.
  const [saved, setSaved] = useState(false);

  return (
    <>
      <AppBar title="Availability" back="/listing" />
      <ScreenBody>
        {role !== "provider" ? (
          <EmptyState title="Availability is for care providers" />
        ) : loading && !listing ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : !listing ? (
          <EmptyState title="Set up your listing first">Then come back to block dates.</EmptyState>
        ) : (
          <>
            {saved && (
              <p role="status" className="flex items-center gap-2 rounded-card bg-mint p-4 text-sm font-semibold">
                <CircleCheck className="size-5 shrink-0" aria-hidden />
                Availability saved.
              </p>
            )}
            {/* Remount when saved dates come back from the database so the editor starts from them. */}
            <AvailabilityEditor
              key={listing.unavailable.join(",")}
              listing={listing}
              onSaved={() => {
                setSaved(true);
                reload();
              }}
              onEdit={() => setSaved(false)}
            />
          </>
        )}
      </ScreenBody>
    </>
  );
}

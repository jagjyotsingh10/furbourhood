import { useParams } from "react-router-dom";

import { useAuth } from "@/auth/AuthProvider";
import { AppBar } from "@/components/AppBar";
import { ScreenBody } from "@/components/AppShell";
import { StatusChip } from "@/components/Badges";
import { PhotoFeed, PhotoUpdateForm } from "@/components/PhotoUpdates";
import { EmptyState, ErrorState, LoadingState } from "@/components/States";
import { Card } from "@/components/ui/card";
import { postBookingUpdate } from "@/data/api";
import { useBookingSummary, useBookingUpdates } from "@/data/hooks";
import { serviceInfo } from "@/lib/catalog";
import { formatDateRange, todayISO } from "@/lib/format";
import { shrinkPhoto } from "@/lib/image";

/** Photo updates for one booking: providers post during it, owners watch. */
export function BookingUpdates() {
  const { id = "" } = useParams();
  const { role } = useAuth();
  const summary = useBookingSummary(id);
  const updates = useBookingUpdates(id);
  const back = role === "provider" ? "/requests" : "/bookings";

  if (summary.loading && !summary.data) {
    return (
      <>
        <AppBar title="Photo updates" back={back} />
        <ScreenBody>
          <LoadingState />
        </ScreenBody>
      </>
    );
  }
  if (summary.error || !summary.data) {
    return (
      <>
        <AppBar title="Photo updates" back={back} />
        <ScreenBody>
          {summary.error ? <ErrorState message={summary.error} onRetry={summary.reload} /> : <EmptyState title="Booking not found" />}
        </ScreenBody>
      </>
    );
  }

  const b = summary.data;
  const today = todayISO();
  // The database enforces the same rule (can_post_booking_update); this only decides whether to show the form.
  const canPost = role === "provider" && (b.status === "accepted" || b.status === "paid") && b.start <= today && today <= b.end;

  return (
    <>
      <AppBar title="Photo updates" back={back} />
      <ScreenBody>
        <Card className="flex items-start justify-between gap-3 p-4">
          <div>
            <h2 className="font-heading text-lg leading-tight font-bold">
              {serviceInfo(b.service).label} for {b.petName}
            </h2>
            <p className="text-sm text-muted-foreground">
              {role === "provider" ? "" : `with ${b.providerName} · `}
              {formatDateRange(b.start, b.end)}
            </p>
          </div>
          <StatusChip status={b.status} />
        </Card>

        {canPost && (
          <PhotoUpdateForm
            petName={b.petName}
            onSend={async (photo, note) => {
              await postBookingUpdate(b.id, await shrinkPhoto(photo), note);
              updates.reload();
            }}
          />
        )}
        {role === "provider" && !canPost && (b.status === "accepted" || b.status === "paid") && (
          <p className="text-sm text-muted-foreground">You can send photo updates from {formatDateRange(b.start, b.start)}.</p>
        )}

        {updates.error ? (
          <ErrorState message={updates.error} onRetry={updates.reload} />
        ) : updates.loading && !updates.data ? (
          <LoadingState label="Loading photos…" />
        ) : (
          <PhotoFeed updates={updates.data ?? []} petName={b.petName} />
        )}
      </ScreenBody>
    </>
  );
}

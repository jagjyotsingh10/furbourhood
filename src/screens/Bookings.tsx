import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { MailCheck, X } from "lucide-react";

import { AppBar } from "@/components/AppBar";
import { DemoNote, ScreenBody } from "@/components/AppShell";
import { BookingCard } from "@/components/BookingCard";
import { FormError } from "@/components/Field";
import { EmptyState, ErrorState, LoadingState } from "@/components/States";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { withdrawBooking, type BookingDetails } from "@/data/api";
import { useBookings } from "@/data/hooks";
import { todayISO } from "@/lib/format";
import type { RequestSentState } from "@/screens/RequestBooking";

/** Owner can take back a request until the provider replies. Two taps, no browser dialog. */
function WithdrawRequest({ id, onDone }: { id: string; onDone: () => void }) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const withdraw = async () => {
    setBusy(true);
    setError(null);
    try {
      await withdrawBooking(id);
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not withdraw. Try again.");
      setBusy(false);
    }
  };

  if (!confirming) {
    return (
      <Button variant="ghost" size="sm" className="w-full" onClick={() => setConfirming(true)}>
        Withdraw request
      </Button>
    );
  }
  return (
    <div className="flex flex-col gap-2 rounded-control bg-coral-tint p-3">
      <p className="text-sm font-semibold">Withdraw this request?</p>
      <FormError message={error} />
      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" size="sm" onClick={() => setConfirming(false)} disabled={busy}>
          Keep it
        </Button>
        <Button variant="destructive" size="sm" onClick={withdraw} disabled={busy}>
          {busy ? "Withdrawing…" : "Withdraw"}
        </Button>
      </div>
    </div>
  );
}

function BookingList({
  items,
  empty,
  highlightId,
  onChanged,
}: {
  items: BookingDetails[];
  empty: string;
  highlightId?: string;
  onChanged: () => void;
}) {
  if (items.length === 0) return <EmptyState title={empty} />;
  return (
    <ul className="flex flex-col gap-3">
      {items.map(({ booking, provider, pet }) => (
        <li key={booking.id}>
          <BookingCard
            booking={booking}
            provider={provider}
            pet={pet}
            highlighted={booking.id === highlightId}
            action={booking.status === "requested" ? <WithdrawRequest id={booking.id} onDone={onChanged} /> : undefined}
          />
        </li>
      ))}
    </ul>
  );
}

export function Bookings() {
  const { data = [], loading, error, reload } = useBookings();
  const location = useLocation();
  const navigate = useNavigate();
  const sent = location.state as RequestSentState | null;
  const today = todayISO();
  const upcoming = data.filter((d) => d.booking.end >= today);
  const past = data.filter((d) => d.booking.end < today).reverse();

  // Clearing router state removes the banner and stops it coming back on refresh.
  const dismiss = () => navigate(location.pathname, { replace: true, state: null });

  return (
    <>
      <AppBar title="Bookings" />
      <ScreenBody>
        {sent && (
          <div role="status" className="flex items-start gap-3 rounded-card bg-mint p-4">
            <MailCheck className="mt-0.5 size-5 shrink-0" aria-hidden />
            <p className="flex-1 text-sm">
              {/* Provider names end in an initial ("Amir H."), so the name never sits before a full stop. */}
              <span className="font-semibold">Request sent.</span> It shows as Requested until {sent.requestedFrom}{" "}
              replies.
            </p>
            <button type="button" onClick={dismiss} aria-label="Dismiss" className="rounded-sm p-0.5 hover:bg-white/50">
              <X className="size-4" aria-hidden />
            </button>
          </div>
        )}
        <Tabs defaultValue="upcoming">
          <TabsList>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="past">Past</TabsTrigger>
          </TabsList>
          {loading ? (
            <LoadingState label="Loading bookings…" />
          ) : error ? (
            <ErrorState message={error} onRetry={reload} />
          ) : (
            <>
              <TabsContent value="upcoming">
                <BookingList
                  items={upcoming}
                  empty="No upcoming bookings."
                  highlightId={sent?.bookingId}
                  onChanged={() => {
                    dismiss();
                    reload();
                  }}
                />
              </TabsContent>
              <TabsContent value="past">
                <BookingList items={past} empty="No past bookings yet." onChanged={reload} />
              </TabsContent>
            </>
          )}
        </Tabs>
        <DemoNote>New accounts start with demo bookings.</DemoNote>
      </ScreenBody>
    </>
  );
}

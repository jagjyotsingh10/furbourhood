import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { CreditCard, MailCheck, Star, X } from "lucide-react";

import { AppBar } from "@/components/AppBar";
import { DemoNote, ScreenBody } from "@/components/AppShell";
import { BookingCard } from "@/components/BookingCard";
import { FormError } from "@/components/Field";
import { EmptyState, ErrorState, LoadingState } from "@/components/States";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { confirmPayment, startCheckout, withdrawBooking, type BookingDetails } from "@/data/api";
import { useBookings } from "@/data/hooks";
import { formatPrice, todayISO } from "@/lib/format";

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

/** Router state other screens hand to Bookings: a confirmation banner, and a booking to highlight. */
export interface BookingsNotice {
  message: string;
  bookingId?: string;
}

/** Accepted care is paid through Stripe Checkout in test mode; no real card is charged. */
function PayAction({ id, total }: { id: string; total: number }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pay = async () => {
    setBusy(true);
    setError(null);
    try {
      window.location.assign(await startCheckout(id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start the payment.");
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <FormError message={error} />
      <Button size="sm" className="w-full" onClick={pay} disabled={busy}>
        <CreditCard aria-hidden />
        {busy ? "Opening checkout…" : `Pay ${formatPrice(total)} (test mode)`}
      </Button>
      <p className="text-center text-xs text-muted-foreground">Test mode: use card 4242 4242 4242 4242.</p>
    </div>
  );
}

/** Completed care can be reviewed once; afterwards the card says so. */
function ReviewAction({ id, reviewed }: { id: string; reviewed: boolean }) {
  if (reviewed) {
    return (
      <p className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
        <Star className="size-4 fill-coral text-coral" aria-hidden />
        You reviewed this booking
      </p>
    );
  }
  return (
    <Button variant="secondary" size="sm" className="w-full" asChild>
      <Link to={`/bookings/${id}/review`}>
        <Star aria-hidden />
        Leave a review
      </Link>
    </Button>
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
      {items.map(({ booking, provider, pet, reviewed }) => (
        <li key={booking.id}>
          <BookingCard
            booking={booking}
            provider={provider}
            pet={pet}
            highlighted={booking.id === highlightId}
            action={
              booking.status === "requested" ? (
                <WithdrawRequest id={booking.id} onDone={onChanged} />
              ) : booking.status === "accepted" ? (
                <PayAction id={booking.id} total={booking.total} />
              ) : booking.status === "completed" ? (
                <ReviewAction id={booking.id} reviewed={reviewed} />
              ) : undefined
            }
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
  const [params] = useSearchParams();
  const paidSession = params.get("paid");
  const [paymentNotice, setPaymentNotice] = useState<BookingsNotice | null>(null);
  const notice = paymentNotice ?? (location.state as BookingsNotice | null);

  // Back from Stripe: confirm the payment once, then drop ?paid= so a refresh doesn't repeat it.
  useEffect(() => {
    if (!paidSession) return;
    let cancelled = false;
    confirmPayment(paidSession)
      .then(() => !cancelled && setPaymentNotice({ message: "Payment received (test mode). The booking is now Paid." }))
      .catch((err: unknown) => !cancelled && setPaymentNotice({ message: err instanceof Error ? err.message : "Could not confirm the payment." }))
      .finally(() => {
        if (cancelled) return;
        navigate("/bookings", { replace: true });
        reload();
      });
    return () => {
      cancelled = true;
    };
  }, [paidSession, navigate, reload]);
  const today = todayISO();
  // Completed care moves to Past straight away, so it's easy to find and review.
  const isPast = (d: BookingDetails) => d.booking.end < today || d.booking.status === "completed";
  const upcoming = data.filter((d) => !isPast(d));
  const past = data.filter(isPast).reverse();

  // Clearing router state removes the banner and stops it coming back on refresh.
  const dismiss = () => {
    setPaymentNotice(null);
    navigate(location.pathname, { replace: true, state: null });
  };

  return (
    <>
      <AppBar title="Bookings" />
      <ScreenBody>
        {notice && (
          <div role="status" className="flex items-start gap-3 rounded-card bg-mint p-4">
            <MailCheck className="mt-0.5 size-5 shrink-0" aria-hidden />
            <p className="flex-1 text-sm">
              {notice.message}
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
                  highlightId={notice?.bookingId}
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

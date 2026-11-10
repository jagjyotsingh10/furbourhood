import { Link } from "react-router-dom";

import { useAuth } from "@/auth/AuthProvider";
import { AppBar } from "@/components/AppBar";
import { ScreenBody } from "@/components/AppShell";
import { canComplete, RequestCard } from "@/components/RequestCard";
import { EmptyState, ErrorState, LoadingState } from "@/components/States";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { updateBookingStatus, type RequestDetails } from "@/data/api";
import { useMyListing, useProviderRequests } from "@/data/hooks";
import { plural, todayISO } from "@/lib/format";
import type { Provider } from "@/types";

function RequestList({
  items,
  listing,
  empty,
  onChanged,
}: {
  items: RequestDetails[];
  listing: Provider;
  empty: string;
  onChanged: () => void;
}) {
  if (items.length === 0) return <EmptyState title={empty} />;
  return (
    <ul className="flex flex-col gap-3">
      {items.map((request) => (
        <li key={request.booking.id}>
          <RequestCard
            request={request}
            listing={listing}
            onAction={async (to, from) => {
              await updateBookingStatus(request.booking.id, from, to);
              onChanged();
            }}
          />
        </li>
      ))}
    </ul>
  );
}

function RequestTabs({ listing }: { listing: Provider }) {
  const { data = [], loading, error, reload } = useProviderRequests(listing.id);
  const today = todayISO();
  const fresh = data.filter((r) => r.booking.status === "requested" && r.booking.end >= today);
  // Confirmed = accepted or paid. It stays here until marked completed, even after its dates pass.
  const confirmed = data.filter((r) => ["accepted", "paid"].includes(r.booking.status));
  const toComplete = confirmed.filter((r) => canComplete(r.booking.status, r.booking.end)).length;
  const past = data
    .filter((r) => !fresh.includes(r) && !confirmed.includes(r))
    .sort((a, b) => b.booking.start.localeCompare(a.booking.start));

  return (
    <Tabs defaultValue="new">
      <TabsList>
        <TabsTrigger value="new">New{fresh.length > 0 && ` (${fresh.length})`}</TabsTrigger>
        <TabsTrigger value="confirmed">Confirmed{toComplete > 0 && ` (${toComplete})`}</TabsTrigger>
        <TabsTrigger value="past">Past</TabsTrigger>
      </TabsList>
      {loading && data.length === 0 ? (
        <LoadingState label="Loading requests…" />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : (
        <>
          <TabsContent value="new">
            <RequestList items={fresh} listing={listing} empty="No new requests." onChanged={reload} />
          </TabsContent>
          <TabsContent value="confirmed">
            {toComplete > 0 && (
              <p className="mb-3 text-sm text-muted-foreground">
                {plural(toComplete, "booking")} ready to mark as completed.
              </p>
            )}
            <RequestList items={confirmed} listing={listing} empty="No confirmed bookings." onChanged={reload} />
          </TabsContent>
          <TabsContent value="past">
            <RequestList items={past} listing={listing} empty="Nothing here yet." onChanged={reload} />
          </TabsContent>
        </>
      )}
    </Tabs>
  );
}

export function Requests() {
  const { role } = useAuth();
  const { data: listing, loading, error, reload } = useMyListing();

  return (
    <>
      <AppBar title="Requests" />
      <ScreenBody>
        {role !== "provider" ? (
          <EmptyState title="Requests are for care providers">Owners see their bookings under Bookings.</EmptyState>
        ) : loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : !listing ? (
          <div className="flex flex-col items-center gap-3 rounded-card bg-card p-6 text-center shadow-card">
            <p className="font-heading text-xl font-extrabold">Set up your listing first</p>
            <p className="text-sm text-muted-foreground">
              Owners can only send you requests once your listing is published.
            </p>
            <Button asChild>
              <Link to="/listing">Set up listing</Link>
            </Button>
          </div>
        ) : (
          <RequestTabs listing={listing} />
        )}
      </ScreenBody>
    </>
  );
}

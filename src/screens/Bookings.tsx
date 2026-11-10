import { AppBar } from "@/components/AppBar";
import { DemoNote, ScreenBody } from "@/components/AppShell";
import { BookingCard } from "@/components/BookingCard";
import { EmptyState, ErrorState, LoadingState } from "@/components/States";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { BookingDetails } from "@/data/api";
import { useBookings } from "@/data/hooks";
import { todayISO } from "@/lib/format";

function BookingList({ items, empty }: { items: BookingDetails[]; empty: string }) {
  if (items.length === 0) return <EmptyState title={empty} />;
  return (
    <ul className="flex flex-col gap-3">
      {items.map(({ booking, provider, pet }) => (
        <li key={booking.id}>
          <BookingCard booking={booking} provider={provider} pet={pet} />
        </li>
      ))}
    </ul>
  );
}

export function Bookings() {
  const { data = [], loading, error, reload } = useBookings();
  const today = todayISO();
  const upcoming = data.filter((d) => d.booking.end >= today);
  const past = data.filter((d) => d.booking.end < today).reverse();

  return (
    <>
      <AppBar title="Bookings" />
      <ScreenBody>
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
                <BookingList items={upcoming} empty="No upcoming bookings." />
              </TabsContent>
              <TabsContent value="past">
                <BookingList items={past} empty="No past bookings yet." />
              </TabsContent>
            </>
          )}
        </Tabs>
        <DemoNote>New accounts start with demo bookings.</DemoNote>
      </ScreenBody>
    </>
  );
}

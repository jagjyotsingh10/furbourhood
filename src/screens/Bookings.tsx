import { AppBar } from "@/components/AppBar";
import { DemoNote, ScreenBody } from "@/components/AppShell";
import { BookingCard } from "@/components/BookingCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DEMO_TODAY, bookings, getPet, getProvider } from "@/mocks";
import type { Booking } from "@/types";

function BookingList({ items, empty }: { items: Booking[]; empty: string }) {
  if (items.length === 0) {
    return <p className="rounded-card bg-card p-6 text-center text-sm text-muted-foreground">{empty}</p>;
  }
  return (
    <ul className="flex flex-col gap-3">
      {items.map((booking) => {
        const provider = getProvider(booking.providerId);
        const pet = getPet(booking.petId);
        if (!provider || !pet) return null;
        return (
          <li key={booking.id}>
            <BookingCard booking={booking} provider={provider} pet={pet} />
          </li>
        );
      })}
    </ul>
  );
}

export function Bookings() {
  const upcoming = bookings.filter((b) => b.end >= DEMO_TODAY).sort((a, b) => a.start.localeCompare(b.start));
  const past = bookings.filter((b) => b.end < DEMO_TODAY).sort((a, b) => b.start.localeCompare(a.start));

  return (
    <>
      <AppBar title="Bookings" />
      <ScreenBody>
        <Tabs defaultValue="upcoming">
          <TabsList>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="past">Past</TabsTrigger>
          </TabsList>
          <TabsContent value="upcoming">
            <BookingList items={upcoming} empty="No upcoming bookings." />
          </TabsContent>
          <TabsContent value="past">
            <BookingList items={past} empty="No past bookings yet." />
          </TabsContent>
        </Tabs>
        <DemoNote />
      </ScreenBody>
    </>
  );
}

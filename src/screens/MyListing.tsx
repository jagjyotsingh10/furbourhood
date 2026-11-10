import { useState } from "react";
import { Link } from "react-router-dom";
import { CalendarX2, ChevronRight, CircleCheck, Eye } from "lucide-react";

import { useAuth } from "@/auth/AuthProvider";
import { AppBar } from "@/components/AppBar";
import { ScreenBody } from "@/components/AppShell";
import { ListingForm } from "@/components/ListingForm";
import { EmptyState, ErrorState, LoadingState } from "@/components/States";
import { Button } from "@/components/ui/button";
import { saveListing, type ListingInput } from "@/data/api";
import { useMyListing } from "@/data/hooks";
import { plural } from "@/lib/format";
import type { Provider } from "@/types";

function toListingInput(listing: Provider | null, fallbackName: string): ListingInput {
  if (!listing) {
    return {
      name: fallbackName,
      tone: "sky",
      areaName: "",
      areaFsa: "",
      bio: "",
      yearsExperience: 0,
      hostCapacity: "",
      services: [],
      needs: [],
    };
  }
  return {
    name: listing.name,
    tone: listing.tone,
    areaName: listing.area.name,
    areaFsa: listing.area.fsa,
    bio: listing.bio,
    yearsExperience: listing.yearsExperience,
    hostCapacity: listing.hostCapacity ?? "",
    services: listing.services,
    needs: listing.skills.map((s) => s.need),
  };
}

export function MyListing() {
  const { user, role, profile } = useAuth();
  const { data: listing, loading, error, reload } = useMyListing();
  // Which banner to show after saving: first publish, or later edits.
  const [saved, setSaved] = useState<"published" | "updated" | null>(null);

  if (role !== "provider") {
    return (
      <>
        <AppBar title="My listing" />
        <ScreenBody>
          <EmptyState title="Listings are for care providers">Sign up as a care provider to offer care.</EmptyState>
        </ScreenBody>
      </>
    );
  }

  return (
    <>
      <AppBar
        title="My listing"
        actions={
          listing ? (
            <Button variant="ghost" size="sm" asChild>
              <Link to={`/providers/${listing.id}`}>
                <Eye aria-hidden />
                Preview
              </Link>
            </Button>
          ) : undefined
        }
      />
      <ScreenBody>
        {loading && !listing ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : (
          <>
            {saved ? (
              <p role="status" className="flex items-center gap-2 rounded-card bg-mint p-4 text-sm font-semibold">
                <CircleCheck className="size-5 shrink-0" aria-hidden />
                {saved === "published" ? "Listing published. Owners can now find you in search." : "Changes saved."}
              </p>
            ) : (
              !listing && (
                <div>
                  <p className="font-heading text-2xl font-extrabold">Set up your listing</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Owners see this when they search. You can change it any time.
                  </p>
                </div>
              )
            )}
            {listing && (
              <Link
                to="/listing/availability"
                className="flex items-center gap-3 rounded-card bg-card p-4 shadow-card hover:bg-sky-tint/50"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-sky-tint">
                  <CalendarX2 className="size-5" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">Availability</span>
                  <span className="block text-sm text-muted-foreground">
                    {listing.unavailable.length === 0
                      ? "You're shown as available every day"
                      : `${plural(listing.unavailable.length, "date")} blocked`}
                  </span>
                </span>
                <ChevronRight className="size-4" aria-hidden />
              </Link>
            )}
            {/* After a save the form already shows what was saved; it only remounts when a new listing gets its id. */}
            <ListingForm
              key={listing?.id ?? "new"}
              initial={toListingInput(listing ?? null, profile?.fullName ?? "")}
              currentSkills={listing?.skills ?? []}
              submitLabel={listing ? "Save changes" : "Publish listing"}
              onSubmit={async (input) => {
                if (!user) return;
                await saveListing(user.id, listing ?? null, input);
                setSaved(listing ? "updated" : "published");
                // Refresh so the next save diffs services and skills against what's stored.
                reload();
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
          </>
        )}
      </ScreenBody>
    </>
  );
}

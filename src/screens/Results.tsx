import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { SlidersHorizontal } from "lucide-react";

import { AppBar } from "@/components/AppBar";
import { DemoNote, ScreenBody } from "@/components/AppShell";
import { ProviderCard } from "@/components/ProviderCard";
import { EmptyState, ErrorState, LoadingState } from "@/components/States";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePets, useProviders } from "@/data/hooks";
import { SEARCH_RADIUS_KM, serviceInfo } from "@/lib/catalog";
import { formatDateRange, plural } from "@/lib/format";
import { allProviders, bestMatches, blockedDuring, isNearby, type ProviderMatch } from "@/lib/match";
import { readSearch, toQuery } from "@/lib/search";

function ProviderList({
  matches,
  showFeatured,
  query,
}: {
  matches: ProviderMatch[];
  showFeatured: boolean;
  query: string;
}) {
  if (matches.length === 0) {
    return <EmptyState title="No providers yet">Try another service or pet.</EmptyState>;
  }
  return (
    <ul className="flex flex-col gap-3">
      {matches.map((m) => (
        <li key={m.provider.id}>
          <ProviderCard match={m} showFeatured={showFeatured} search={query} />
        </li>
      ))}
    </ul>
  );
}

export function Results() {
  const [params] = useSearchParams();
  const search = readSearch(params);
  const query = toQuery(search);
  const service = serviceInfo(search.service);
  const providers = useProviders();
  const pets = usePets();
  // Remembers which area the owner widened, so a new search starts nearby again.
  const [widenedArea, setWidenedArea] = useState<string | null>(null);
  const showFarther = widenedArea === search.area;

  const petList = pets.data ?? [];
  const pet = petList.find((p) => p.id === search.petId) ?? petList[0];
  // Providers who blocked any of the owner's dates are left out of both lists,
  // and so are those beyond the search radius unless the owner asks to see them.
  const everyone = providers.data ?? [];
  const available = everyone.filter((p) => blockedDuring(p, search.from, search.to).length === 0);
  const nearby = available.filter((p) => isNearby(p, search.area));
  const providerList = showFarther ? available : nearby;
  const offering = (list: typeof everyone) => allProviders(list, pet, search.service).length;
  const unavailableCount = offering(everyone) - offering(available);
  const fartherCount = offering(available) - offering(nearby);
  const best = bestMatches(providerList, pet, search.service);
  const all = allProviders(providerList, pet, search.service);
  const hiddenNote = (
    <>
      {unavailableCount > 0 && (
        <p className="text-xs text-muted-foreground">
          {plural(unavailableCount, "provider")} {unavailableCount === 1 ? "isn't" : "aren't"} available on{" "}
          {formatDateRange(search.from, search.to)}, so {unavailableCount === 1 ? "isn't" : "aren't"} shown.
        </p>
      )}
      {fartherCount > 0 && (
        <p className="text-xs text-muted-foreground">
          {showFarther
            ? `Including ${plural(fartherCount, "provider")} more than ${SEARCH_RADIUS_KM} km from ${search.area}. `
            : `${plural(fartherCount, "provider")} more than ${SEARCH_RADIUS_KM} km from ${search.area} ${fartherCount === 1 ? "isn't" : "aren't"} shown. `}
          <button type="button" className="font-semibold text-navy underline underline-offset-4" onClick={() => setWidenedArea(showFarther ? null : search.area)}>
            {showFarther ? "Show nearby only" : "Show them"}
          </button>
        </p>
      )}
    </>
  );
  const loading = providers.loading || pets.loading;
  const error = providers.error ?? pets.error;

  return (
    <>
      <AppBar
        title={service.label}
        back="/find"
        actions={
          <Button variant="ghost" size="icon" aria-label="Edit search" asChild>
            <Link to="/find">
              <SlidersHorizontal className="size-5!" aria-hidden />
            </Link>
          </Button>
        }
      />
      <ScreenBody>
        <p className="text-sm text-muted-foreground">
          {pet ? `For ${pet.name}` : "Any pet"} · near {search.area} · {formatDateRange(search.from, search.to)}
        </p>

        <Tabs defaultValue="best">
          <TabsList>
            <TabsTrigger value="best">Best match</TabsTrigger>
            <TabsTrigger value="all">All providers</TabsTrigger>
          </TabsList>

          {loading ? (
            <LoadingState label="Finding providers…" />
          ) : error ? (
            <ErrorState
              message={error}
              onRetry={() => {
                providers.reload();
                pets.reload();
              }}
            />
          ) : (
            <>
              <TabsContent value="best" className="flex flex-col gap-3">
                <p className="text-sm text-muted-foreground">
                  {plural(best.length, "provider")} ranked by how well they meet
                  {pet ? ` ${pet.name}'s` : " your pet's"} needs. Paid placement never changes this list.
                </p>
                <ProviderList matches={best} showFeatured={false} query={query} />
                {hiddenNote}
              </TabsContent>

              <TabsContent value="all" className="flex flex-col gap-3">
                <p className="text-sm text-muted-foreground">
                  Everyone offering {service.label.toLowerCase()} near you. Featured providers are shown first.
                </p>
                <ProviderList matches={all} showFeatured query={query} />
                {hiddenNote}
              </TabsContent>
            </>
          )}
        </Tabs>

        <DemoNote />
      </ScreenBody>
    </>
  );
}

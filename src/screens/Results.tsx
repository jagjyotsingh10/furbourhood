import { Link, useSearchParams } from "react-router-dom";
import { SlidersHorizontal } from "lucide-react";

import { AppBar } from "@/components/AppBar";
import { DemoNote, ScreenBody } from "@/components/AppShell";
import { ProviderCard } from "@/components/ProviderCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { serviceInfo } from "@/lib/catalog";
import { formatDateRange, plural } from "@/lib/format";
import { allProviders, bestMatches, type ProviderMatch } from "@/lib/match";
import { readSearch, toQuery } from "@/lib/search";
import { getPet, providers } from "@/mocks";

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
    return <p className="rounded-card bg-card p-6 text-center text-sm text-muted-foreground">No providers yet.</p>;
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
  const pet = getPet(search.petId);
  const service = serviceInfo(search.service);

  const best = bestMatches(providers, pet, search.service);
  const all = allProviders(providers, pet, search.service);

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

          <TabsContent value="best" className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">
              {plural(best.length, "provider")} ranked by how well they meet
              {pet ? ` ${pet.name}'s` : " your pet's"} needs. Paid placement never changes this list.
            </p>
            <ProviderList matches={best} showFeatured={false} query={query} />
          </TabsContent>

          <TabsContent value="all" className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">
              Everyone offering {service.label.toLowerCase()} near you. Featured providers are shown first.
            </p>
            <ProviderList matches={all} showFeatured query={query} />
          </TabsContent>
        </Tabs>

        <DemoNote />
      </ScreenBody>
    </>
  );
}

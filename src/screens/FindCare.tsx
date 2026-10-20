import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";

import { AppBar } from "@/components/AppBar";
import { DemoNote, ScreenBody } from "@/components/AppShell";
import { NeedChip } from "@/components/NeedChip";
import { ServiceTile } from "@/components/ServiceTile";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AREAS, SERVICES } from "@/lib/catalog";
import { DEFAULT_SEARCH, FSA_PATTERN, toQuery, type CareSearch } from "@/lib/search";
import { demoOwner, getPet, pets } from "@/mocks";

export function FindCare() {
  const navigate = useNavigate();
  const [search, setSearch] = useState<CareSearch>(DEFAULT_SEARCH);
  const pet = getPet(search.petId);
  const areaValid = FSA_PATTERN.test(search.area);
  const firstName = demoOwner.name.split(" ")[0];

  const update = (patch: Partial<CareSearch>) => setSearch((s) => ({ ...s, ...patch }));

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (areaValid) navigate(`/results${toQuery(search)}`);
  };

  return (
    <>
      <AppBar title="Find care" />
      <ScreenBody>
        <div>
          <p className="text-sm text-muted-foreground">Hi {firstName}</p>
          <p className="font-heading text-2xl font-extrabold">What does your pet need?</p>
        </div>

        <section aria-labelledby="services-title">
          <h2 id="services-title" className="sr-only">
            Services
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {SERVICES.map((service) => (
              <ServiceTile
                key={service.id}
                service={service}
                selected={search.service === service.id}
                onSelect={() => update({ service: service.id })}
              />
            ))}
          </div>
        </section>

        <Card className="p-4">
          <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pet">Which pet?</Label>
              <Select value={search.petId} onValueChange={(petId) => update({ petId })}>
                <SelectTrigger id="pet">
                  <SelectValue placeholder="Choose a pet" />
                </SelectTrigger>
                <SelectContent>
                  {pets.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} ({p.species.toLowerCase()})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {pet && pet.needs.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1.5" aria-label={`${pet.name}'s care needs`}>
                  {pet.needs.map((need) => (
                    <NeedChip key={need} need={need} />
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="area">Area</Label>
              <Input
                id="area"
                value={search.area}
                onChange={(e) => update({ area: e.target.value.toUpperCase().replace(/\s/g, "").slice(0, 3) })}
                placeholder="Postal code start, e.g. N9A"
                autoComplete="off"
                autoCapitalize="characters"
                maxLength={3}
                aria-invalid={!areaValid}
                aria-describedby="area-hint"
              />
              <p id="area-hint" className={areaValid ? "text-xs text-muted-foreground" : "text-xs text-destructive"}>
                {areaValid
                  ? (AREAS[search.area] ?? "Windsor-Essex") + " · first 3 characters of your postal code"
                  : "Enter the first 3 characters of your postal code, like N9A"}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="from">From</Label>
                <Input id="from" type="date" value={search.from} onChange={(e) => update({ from: e.target.value })} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="to">To</Label>
                <Input
                  id="to"
                  type="date"
                  value={search.to}
                  min={search.from}
                  onChange={(e) => update({ to: e.target.value })}
                />
              </div>
            </div>

            <Button type="submit" size="lg" disabled={!areaValid}>
              <Search aria-hidden />
              Search
            </Button>
          </form>
        </Card>

        <DemoNote />
      </ScreenBody>
    </>
  );
}

import { useState, type FormEvent } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { CircleCheck, MapPin } from "lucide-react";

import { AppBar } from "@/components/AppBar";
import { DemoNote, ScreenBody } from "@/components/AppShell";
import { Avatar } from "@/components/Avatar";
import { VerifiedBadge } from "@/components/Badges";
import { ChoiceGroup, Field, FormError } from "@/components/Field";
import { LevelBadge } from "@/components/LevelBadge";
import { EmptyState, ErrorState, LoadingState } from "@/components/States";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { requestBooking } from "@/data/api";
import { usePets, useProvider } from "@/data/hooks";
import { NEED_LABELS, serviceInfo } from "@/lib/catalog";
import { formatDateRange, formatPrice, plural, todayISO } from "@/lib/format";
import { matchProvider } from "@/lib/match";
import { bookingLength, estimatePrice, MAX_BOOKING_DAYS } from "@/lib/pricing";
import { readSearch } from "@/lib/search";
import { NotFound } from "@/screens/NotFound";
import type { ServiceId } from "@/types";

/** State handed to the Bookings screen so it can confirm the request was sent. */
export interface RequestSentState {
  requestedFrom: string;
  bookingId: string;
}

export function RequestBooking() {
  const { id = "" } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const search = readSearch(params);
  const provider = useProvider(id);
  const pets = usePets();

  const offered = provider.data?.services ?? [];
  const [service, setService] = useState<ServiceId | null>(null);
  const [petId, setPetId] = useState(search.petId);
  const [from, setFrom] = useState(search.from);
  const [to, setTo] = useState(search.to);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (provider.loading || pets.loading) {
    return (
      <>
        <AppBar title="Request booking" back />
        <ScreenBody>
          <LoadingState />
        </ScreenBody>
      </>
    );
  }
  const loadError = provider.error ?? pets.error;
  if (loadError) {
    return (
      <>
        <AppBar title="Request booking" back />
        <ScreenBody>
          <ErrorState
            message={loadError}
            onRetry={() => {
              provider.reload();
              pets.reload();
            }}
          />
        </ScreenBody>
      </>
    );
  }
  const p = provider.data;
  if (!p) return <NotFound />;

  const petList = pets.data ?? [];
  // Defaults: the service from the search if this provider offers it, otherwise their first; the first pet.
  const chosenService =
    service ?? (offered.some((s) => s.service === search.service) ? search.service : offered[0]?.service);
  const offer = offered.find((s) => s.service === chosenService);
  const pet = petList.find((x) => x.id === petId) ?? petList[0];
  const match = pet && chosenService ? matchProvider(p, pet, chosenService) : null;
  const today = todayISO();

  const dateError =
    from < today
      ? "Choose a start date from today onwards."
      : to < from
        ? "The end date must be on or after the start date."
        : bookingLength(from, to) > MAX_BOOKING_DAYS
          ? `Bookings can be at most ${MAX_BOOKING_DAYS} days long.`
          : null;
  const estimate = offer && !dateError ? estimatePrice(offer.service, offer.rate, from, to) : null;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!offer || !pet || dateError) return;
    setBusy(true);
    setError(null);
    try {
      const bookingId = await requestBooking({ providerId: p.id, petId: pet.id, service: offer.service, start: from, end: to });
      const state: RequestSentState = { requestedFrom: p.name, bookingId };
      navigate("/bookings", { replace: true, state });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send the request. Try again.");
      setBusy(false);
    }
  };

  return (
    <>
      <AppBar title="Request booking" back />
      <ScreenBody>
        <Card className="flex items-center gap-3 p-4">
          <Avatar name={p.name} tone={p.tone} size="lg" />
          <div className="min-w-0">
            <h2 className="font-heading text-lg leading-tight font-bold">{p.name}</h2>
            <p className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="size-3.5" aria-hidden />
              {p.area.name} · {p.area.fsa}
            </p>
            {p.verifiedInPerson && <VerifiedBadge className="mt-1" />}
          </div>
        </Card>

        {petList.length === 0 ? (
          <EmptyState title="Add a pet first">You need a pet on your account to request care.</EmptyState>
        ) : (
          <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
            <Card className="p-4">
              <ChoiceGroup
                name="service"
                legend="Service"
                columns={1}
                value={chosenService ?? "walking"}
                onChange={setService}
                options={offered.map((s) => ({
                  value: s.service,
                  label: serviceInfo(s.service).label,
                  icon: (
                    <span className="order-last font-normal">
                      <span className="font-bold">{formatPrice(s.rate)}</span> / {s.unit}
                    </span>
                  ),
                }))}
              />
            </Card>

            <Card className="flex flex-col gap-3 p-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="request-pet">Which pet?</Label>
                <Select value={pet?.id} onValueChange={setPetId}>
                  <SelectTrigger id="request-pet">
                    <SelectValue placeholder="Choose a pet" />
                  </SelectTrigger>
                  <SelectContent>
                    {petList.map((x) => (
                      <SelectItem key={x.id} value={x.id}>
                        {x.name} ({x.species.toLowerCase()})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {match && match.needsTotal > 0 && (
                <div className="rounded-control bg-cloud p-3">
                  <p className="flex items-center gap-1.5 text-sm font-semibold">
                    <CircleCheck className="size-4" aria-hidden />
                    Meets {match.matchedSkills.length} of {pet?.name}'s {match.needsTotal} needs
                  </p>
                  {match.matchedSkills.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {match.matchedSkills.map((skill) => (
                        <LevelBadge key={skill.need} level={skill.level} label={NEED_LABELS[skill.need]} />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </Card>

            <Card className="flex flex-col gap-2 p-4">
              <div className="grid grid-cols-2 gap-3">
                <Field id="request-from" label="From" type="date" min={today} value={from} onChange={(e) => setFrom(e.target.value)} />
                <Field id="request-to" label="To" type="date" min={from} value={to} onChange={(e) => setTo(e.target.value)} />
              </div>
              {dateError && (
                <p className="text-xs text-destructive" role="alert">
                  {dateError}
                </p>
              )}
            </Card>

            {offer && estimate && (
              <Card className="flex flex-col gap-1 p-4" aria-live="polite">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-sm text-muted-foreground">
                    {plural(estimate.units, offer.unit)} × {formatPrice(offer.rate)}
                  </span>
                  <span className="font-heading text-2xl font-extrabold">{formatPrice(estimate.total)}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatDateRange(from, to)}. You won't pay anything until {p.name} accepts.
                </p>
              </Card>
            )}

            <FormError message={error} />
            <Button type="submit" size="lg" disabled={busy || !offer || !!dateError}>
              {busy ? "Sending…" : "Send request"}
            </Button>
            <DemoNote>Demo providers don't reply yet, so requests stay Requested.</DemoNote>
          </form>
        )}
      </ScreenBody>
    </>
  );
}

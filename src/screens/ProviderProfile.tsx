import { useParams, useSearchParams } from "react-router-dom";
import { BedDouble, MapPin } from "lucide-react";

import { AppBar } from "@/components/AppBar";
import { DemoNote, ScreenBody, SectionTitle } from "@/components/AppShell";
import { Avatar } from "@/components/Avatar";
import { Rating, VerifiedBadge } from "@/components/Badges";
import { LevelBadge } from "@/components/LevelBadge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { NEED_LABELS, serviceInfo } from "@/lib/catalog";
import { formatDate, formatPrice, plural } from "@/lib/format";
import { lowestRate } from "@/lib/match";
import { readSearch } from "@/lib/search";
import { getProvider } from "@/mocks";
import { NotFound } from "@/screens/NotFound";

export function ProviderProfile() {
  const { id = "" } = useParams();
  const [params] = useSearchParams();
  const provider = getProvider(id);
  if (!provider) return <NotFound />;

  const search = readSearch(params);
  const offer = provider.services.find((s) => s.service === search.service) ?? lowestRate(provider);

  return (
    <>
      <AppBar title={provider.name} back />
      <ScreenBody withActionBar>
        <Card className="flex flex-col items-center p-5 text-center">
          <Avatar name={provider.name} tone={provider.tone} size="xl" />
          <h2 className="mt-3 font-heading text-2xl font-extrabold">{provider.name}</h2>
          <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="size-3.5" aria-hidden />
            {provider.area.name} · {provider.area.fsa}
          </p>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
            <Rating rating={provider.rating} reviewCount={provider.reviewCount} />
            {provider.verifiedInPerson && <VerifiedBadge />}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {plural(provider.yearsExperience, "year")} caring for pets
          </p>
          {provider.hostCapacity && (
            <p className="mt-4 flex w-full items-center justify-center gap-2 rounded-control bg-mint-tint px-3 py-2.5 text-sm font-semibold">
              <BedDouble className="size-4 shrink-0" aria-hidden />
              {provider.hostCapacity}
            </p>
          )}
        </Card>

        <section className="flex flex-col gap-2">
          <SectionTitle>About</SectionTitle>
          <p className="text-[15px] leading-relaxed">{provider.bio}</p>
        </section>

        <section className="flex flex-col gap-2">
          <SectionTitle>Skills</SectionTitle>
          <Card>
            <ul className="divide-y">
              {provider.skills.map((skill) => (
                <li key={skill.need} className="flex items-center justify-between gap-3 px-4 py-3">
                  <span className="font-medium">{NEED_LABELS[skill.need]}</span>
                  <LevelBadge level={skill.level} />
                </li>
              ))}
            </ul>
          </Card>
          <p className="text-xs text-muted-foreground">Tap a badge to see what each level means.</p>
        </section>

        <section className="flex flex-col gap-2">
          <SectionTitle>Services and rates</SectionTitle>
          <Card>
            <ul className="divide-y">
              {provider.services.map((s) => {
                const info = serviceInfo(s.service);
                const Icon = info.icon;
                return (
                  <li key={s.service} className="flex items-center gap-3 px-4 py-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-sky-tint">
                      <Icon className="size-4" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium">{info.label}</span>
                      <span className="block text-xs text-muted-foreground">{info.hint}</span>
                    </span>
                    <span className="text-right text-sm text-muted-foreground">
                      <span className="text-base font-bold text-navy">{formatPrice(s.rate)}</span> / {s.unit}
                    </span>
                  </li>
                );
              })}
            </ul>
          </Card>
        </section>

        <section className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between">
            <SectionTitle>Reviews</SectionTitle>
            <Rating rating={provider.rating} reviewCount={provider.reviewCount} />
          </div>
          <ul className="flex flex-col gap-3">
            {provider.reviews.map((review) => (
              <li key={review.id}>
                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <Avatar name={review.author} tone="sky" size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">
                        {review.author} <span className="font-normal text-muted-foreground">with {review.petName}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">{formatDate(review.date)}</p>
                    </div>
                    <Rating rating={review.rating} />
                  </div>
                  <p className="mt-2 text-sm leading-relaxed">{review.text}</p>
                </Card>
              </li>
            ))}
          </ul>
        </section>

        <DemoNote />
      </ScreenBody>

      {/* Sticky booking bar, sits directly above the bottom tabs */}
      <div className="fixed inset-x-0 bottom-[calc(4.25rem+env(safe-area-inset-bottom))] z-30 mx-auto max-w-[480px] border-t bg-white px-4 py-3">
        <div className="flex items-center gap-3">
          {offer && (
            <p className="text-xs leading-tight text-muted-foreground">
              from
              <br />
              <span className="font-heading text-xl font-extrabold text-navy">{formatPrice(offer.rate)}</span> /{" "}
              {offer.unit}
            </p>
          )}
          <Button size="lg" className="flex-1">
            Request booking
          </Button>
        </div>
      </div>
    </>
  );
}

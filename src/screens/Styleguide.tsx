import type { ReactNode } from "react";
import { Plus, Search } from "lucide-react";

import { AppBar } from "@/components/AppBar";
import { ScreenBody, SectionTitle } from "@/components/AppShell";
import { Avatar } from "@/components/Avatar";
import { FeaturedBadge, Rating, StatusChip, VerifiedBadge } from "@/components/Badges";
import { LevelBadge } from "@/components/LevelBadge";
import { NeedChip } from "@/components/NeedChip";
import { PetCard } from "@/components/PetCard";
import { ProviderCard } from "@/components/ProviderCard";
import { ServiceTile } from "@/components/ServiceTile";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SERVICES } from "@/lib/catalog";
import { matchProvider } from "@/lib/match";
import { getPet, pets, providers } from "@/mocks";
import type { BookingStatus, CareNeed, SkillLevel } from "@/types";

const COLOURS = [
  { name: "Navy", hex: "#203B56", swatch: "bg-navy", use: "Text, primary buttons (white text)" },
  { name: "Sky", hex: "#74C7EC", swatch: "bg-sky", use: "Accent, selected states (navy text)" },
  { name: "Mint", hex: "#A8E6CF", swatch: "bg-mint", use: "Success, Proven badges (navy text)" },
  { name: "Coral", hex: "#FF927D", swatch: "bg-coral", use: "Highlights, Featured badge (navy text)" },
  { name: "Cloud", hex: "#F7FBFF", swatch: "bg-cloud border", use: "App background; cards are white" },
  { name: "Slate", hex: "#4A5D70", swatch: "bg-slate", use: "Muted text, outlines (6.8:1 on white)" },
];

const CONTRAST = [
  ["Navy on white", "11.5:1"],
  ["Navy on cloud", "11.1:1"],
  ["Navy on sky", "6.1:1"],
  ["Navy on mint", "8.2:1"],
  ["Navy on coral", "5.3:1"],
  ["White on navy", "11.5:1"],
  ["Slate on white", "6.8:1"],
];

const TYPE_SCALE = [
  { label: "Display · Nunito 800 · 28px", className: "font-heading text-[28px] font-extrabold leading-tight" },
  { label: "Title · Nunito 800 · 24px", className: "font-heading text-2xl font-extrabold" },
  { label: "Heading · Nunito 700 · 18px", className: "font-heading text-lg font-bold" },
  { label: "Body · Inter 400 · 16px", className: "text-base" },
  { label: "Body strong · Inter 600 · 14px", className: "text-sm font-semibold" },
  { label: "Caption · Inter 500 · 12px", className: "text-xs font-medium text-muted-foreground" },
];

const LEVELS: SkillLevel[] = ["self-declared", "verified", "proven"];
const STATUSES: BookingStatus[] = ["requested", "accepted", "paid", "completed"];
const NEEDS: CareNeed[] = ["senior-care", "oral-medication", "anxiety", "injections", "puppy-training"];

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <SectionTitle>{title}</SectionTitle>
      {children}
    </section>
  );
}

export function Styleguide() {
  const biscuit = getPet("biscuit");
  const sampleMatch = matchProvider(providers[1]!, biscuit, "boarding");

  return (
    <>
      <AppBar title="Style guide" back="/profile" />
      <ScreenBody className="gap-8">
        <Block title="Logo">
          <Card className="flex items-center gap-4 p-4">
            <img src="/brand/furbourhood-mark.png" alt="Furbourhood mark" className="size-12" />
            <img src="/brand/furbourhood-logo.png" alt="Furbourhood logo" className="h-auto min-w-0 flex-1" />
          </Card>
          <p className="text-sm text-muted-foreground">Full logo on Welcome only. Square mark in the app bar.</p>
        </Block>

        <Block title="Colours">
          <ul className="grid grid-cols-2 gap-3">
            {COLOURS.map((c) => (
              <li key={c.name}>
                <Card className="overflow-hidden">
                  <div className={`h-16 ${c.swatch}`} />
                  <div className="p-3">
                    <p className="font-semibold">
                      {c.name} <span className="font-normal text-muted-foreground">{c.hex}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">{c.use}</p>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
          <Card className="p-4">
            <p className="mb-2 text-sm font-semibold">WCAG AA contrast (4.5:1 needed for body text)</p>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              {CONTRAST.map(([pair, ratio]) => (
                <li key={pair} className="flex justify-between">
                  <span>{pair}</span>
                  <span className="font-semibold">{ratio}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-muted-foreground">
              Sky, mint and coral are fills only. Never use them as text on white.
            </p>
          </Card>
        </Block>

        <Block title="Type scale">
          <Card className="flex flex-col gap-3 p-4">
            {TYPE_SCALE.map((t) => (
              <div key={t.label}>
                <p className={t.className}>Care for every paw</p>
                <p className="text-xs text-muted-foreground">{t.label}</p>
              </div>
            ))}
          </Card>
        </Block>

        <Block title="Buttons">
          <div className="flex flex-wrap gap-3">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button disabled>Disabled</Button>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button size="lg">
              <Search aria-hidden />
              Search
            </Button>
            <Button variant="outline" size="lg" className="border-dashed">
              <Plus aria-hidden />
              Add pet
            </Button>
          </div>
        </Block>

        <Block title="Inputs and tabs">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="sg-area">Area</Label>
            <Input id="sg-area" placeholder="Postal code start, e.g. N9A" />
          </div>
          <Tabs defaultValue="a">
            <TabsList>
              <TabsTrigger value="a">Selected</TabsTrigger>
              <TabsTrigger value="b">Not selected</TabsTrigger>
            </TabsList>
          </Tabs>
        </Block>

        <Block title="Skill level badges">
          <Card className="flex flex-col gap-3 p-4">
            {LEVELS.map((level) => (
              <div key={level} className="flex items-center justify-between gap-3">
                <LevelBadge level={level} />
                <LevelBadge level={level} label="Senior care" />
              </div>
            ))}
          </Card>
          <p className="text-sm text-muted-foreground">
            Self-declared: grey outline. Verified: sky fill, shield. Proven: mint fill, check, tooltip "Confirmed by 3+
            owners". Hover, focus or tap to see the tooltip.
          </p>
        </Block>

        <Block title="Other badges">
          <div className="flex flex-wrap gap-2">
            <VerifiedBadge />
            <FeaturedBadge />
            <Rating rating={4.9} reviewCount={48} />
          </div>
          <p className="text-sm text-muted-foreground">Featured shows on All providers only, never on Best match.</p>
        </Block>

        <Block title="Booking status chips">
          <div className="flex flex-wrap gap-2">
            {STATUSES.map((s) => (
              <StatusChip key={s} status={s} />
            ))}
          </div>
        </Block>

        <Block title="Care need chips">
          <div className="flex flex-wrap gap-1.5">
            {NEEDS.map((n) => (
              <NeedChip key={n} need={n} />
            ))}
          </div>
        </Block>

        <Block title="Avatars">
          <div className="flex items-end gap-3">
            <Avatar name="Priya S." tone="sky" size="sm" />
            <Avatar name="Marc T." tone="mint" />
            <Avatar name="Hannah O." tone="coral" size="lg" />
            <Avatar name="Jordan P." tone="navy" size="xl" />
          </div>
        </Block>

        <Block title="Service tiles">
          <div className="grid grid-cols-3 gap-3">
            <ServiceTile service={SERVICES[0]!} selected />
            <ServiceTile service={SERVICES[1]!} />
            <ServiceTile service={SERVICES[3]!} />
          </div>
        </Block>

        <Block title="Cards">
          <ProviderCard match={sampleMatch} showFeatured />
          {pets[0] && <PetCard pet={pets[0]} />}
        </Block>
      </ScreenBody>
    </>
  );
}

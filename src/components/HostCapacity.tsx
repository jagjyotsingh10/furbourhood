import { BedDouble, House } from "lucide-react";

import type { HostSpace } from "@/data/api";
import { HOSTED_SERVICES, HOUSEHOLD_LIMIT } from "@/lib/catalog";
import { plural } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Pet, Provider } from "@/types";

/** True when the provider offers care at their own home, so the household limit applies. */
export function hostsAtHome(provider: Provider) {
  return provider.services.some((s) => HOSTED_SERVICES.includes(s.service));
}

/** "Lives with 1 dog and 1 cat", or null when the provider has no pets. */
export function ownPetsLine(provider: Provider) {
  const parts = [
    provider.ownDogs > 0 ? plural(provider.ownDogs, "dog") : "",
    provider.ownCats > 0 ? plural(provider.ownCats, "cat") : "",
  ].filter(Boolean);
  return parts.length > 0 ? `Lives with ${parts.join(" and ")}` : null;
}

/** Guest space for one species, worded for the owner. */
export function spaceText(space: HostSpace, species?: Pet["species"]) {
  const dogs = space.dogsLeft === 0 ? "no more dogs" : `${plural(space.dogsLeft, "more dog")}`;
  const cats = space.catsLeft === 0 ? "no more cats" : `${plural(space.catsLeft, "more cat")}`;
  if (species === "Dog") return space.dogsLeft === 0 ? "No space for another dog on these dates" : `Space for ${dogs} on these dates`;
  if (species === "Cat") return space.catsLeft === 0 ? "No space for another cat on these dates" : `Space for ${cats} on these dates`;
  return `Space for ${dogs} and ${cats} on these dates`;
}

interface HostCapacityProps {
  provider: Provider;
  /** Space on the owner's dates, when known */
  space?: HostSpace | null;
  species?: Pet["species"];
  className?: string;
}

/**
 * The by-law capacity line for hosts (City of Windsor By-law 8156): own pets, and guest space on the
 * owner's dates. Mint when there is space, coral when the home is full. Renders nothing for non-hosts.
 */
export function HostCapacity({ provider, space, species, className }: HostCapacityProps) {
  if (!hostsAtHome(provider)) return null;
  const own = ownPetsLine(provider);
  const full = space ? (species === "Cat" ? space.catsLeft === 0 : species === "Dog" ? space.dogsLeft === 0 : false) : false;

  return (
    <div className={cn("flex flex-col gap-1 rounded-control px-3 py-2.5 text-sm", full ? "bg-coral-tint" : "bg-mint-tint", className)}>
      <p className="flex items-center justify-center gap-2 font-semibold">
        <BedDouble className="size-4 shrink-0" aria-hidden />
        {space
          ? spaceText(space, species)
          : `Hosts up to ${HOUSEHOLD_LIMIT.Dog} dogs and ${HOUSEHOLD_LIMIT.Cat} cats at a time, own pets included`}
      </p>
      <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        <House className="size-3.5 shrink-0" aria-hidden />
        {own ? `${own} · ` : ""}By-law 8156 limit applied automatically
      </p>
    </div>
  );
}

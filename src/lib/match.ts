import { AREA_CENTRES, SEARCH_RADIUS_KM } from "@/lib/catalog";
import type { Pet, Provider, ProviderService, ProviderSkill, ServiceId, SkillLevel } from "@/types";

export interface ProviderMatch {
  provider: Provider;
  /** The provider's skills that cover the pet's care needs */
  matchedSkills: ProviderSkill[];
  needsTotal: number;
  offer: ProviderService | undefined;
}

const LEVEL_WEIGHT: Record<SkillLevel, number> = { "self-declared": 1, verified: 2, proven: 3 };

export function matchProvider(provider: Provider, pet: Pet | undefined, service: ServiceId): ProviderMatch {
  const needs = pet?.needs ?? [];
  return {
    provider,
    matchedSkills: provider.skills.filter((s) => needs.includes(s.need)),
    needsTotal: needs.length,
    offer: provider.services.find((s) => s.service === service),
  };
}

function strength(m: ProviderMatch) {
  return m.matchedSkills.reduce((sum, s) => sum + LEVEL_WEIGHT[s.level], 0);
}

/**
 * Best match: ranked only by how well a provider meets the pet's needs, then
 * verification and rating. Featured placement must never affect this list.
 */
export function bestMatches(providers: Provider[], pet: Pet | undefined, service: ServiceId): ProviderMatch[] {
  return providers
    .map((p) => matchProvider(p, pet, service))
    .filter((m) => m.offer && m.matchedSkills.length > 0)
    .sort(
      (a, b) =>
        b.matchedSkills.length - a.matchedSkills.length ||
        strength(b) - strength(a) ||
        Number(b.provider.verifiedInPerson) - Number(a.provider.verifiedInPerson) ||
        b.provider.rating - a.provider.rating,
    );
}

/** All providers offering the service: featured first, then by rating. */
export function allProviders(providers: Provider[], pet: Pet | undefined, service: ServiceId): ProviderMatch[] {
  return providers
    .map((p) => matchProvider(p, pet, service))
    .filter((m) => m.offer)
    .sort((a, b) => Number(b.provider.featured) - Number(a.provider.featured) || b.provider.rating - a.provider.rating);
}

export function lowestRate(provider: Provider): ProviderService | undefined {
  return [...provider.services].sort((a, b) => a.rate - b.rate)[0];
}

/** The provider's blocked dates that fall inside the owner's dates (empty = available). */
export function blockedDuring(provider: Provider, from: string, to: string): string[] {
  if (!from || !to) return [];
  return provider.unavailable.filter((day) => day >= from && day <= to);
}

/** Straight-line distance between two areas in km, or null when either area isn't on the map. */
export function areaDistanceKm(fromFsa: string, toFsa: string): number | null {
  const a = AREA_CENTRES[fromFsa];
  const b = AREA_CENTRES[toFsa];
  if (!a || !b) return null;
  const rad = Math.PI / 180;
  const dLat = (b[0] - a[0]) * rad;
  const dLng = (b[1] - a[1]) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * rad) * Math.cos(b[0] * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

/** True when the provider is within the search radius, or when the owner's area isn't known. */
export function isNearby(provider: Provider, ownerFsa: string): boolean {
  const km = areaDistanceKm(ownerFsa, provider.area.fsa);
  return km === null || km <= SEARCH_RADIUS_KM;
}

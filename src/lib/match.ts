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

import { SERVICES } from "@/lib/catalog";
import type { ServiceId } from "@/types";

/** A care search, kept in the URL so Results and Profile can share it. */
export interface CareSearch {
  service: ServiceId;
  petId: string;
  area: string;
  from: string;
  to: string;
}

export const DEFAULT_SEARCH: CareSearch = {
  service: "walking",
  petId: "biscuit",
  area: "N9A",
  from: "2026-10-24",
  to: "2026-10-26",
};

function isService(value: string | null): value is ServiceId {
  return SERVICES.some((s) => s.id === value);
}

export function readSearch(params: URLSearchParams): CareSearch {
  const service = params.get("service");
  return {
    service: isService(service) ? service : DEFAULT_SEARCH.service,
    petId: params.get("pet") ?? DEFAULT_SEARCH.petId,
    area: params.get("area") ?? DEFAULT_SEARCH.area,
    from: params.get("from") ?? DEFAULT_SEARCH.from,
    to: params.get("to") ?? DEFAULT_SEARCH.to,
  };
}

export function toQuery(search: CareSearch): string {
  const params = new URLSearchParams({
    service: search.service,
    pet: search.petId,
    area: search.area,
    from: search.from,
    to: search.to,
  });
  return `?${params.toString()}`;
}

/** Canadian postal code prefix (forward sortation area), e.g. N9A */
export const FSA_PATTERN = /^[A-Z]\d[A-Z]$/;

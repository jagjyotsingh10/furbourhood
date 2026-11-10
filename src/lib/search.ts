import { SERVICES } from "@/lib/catalog";
import { addDays, todayISO } from "@/lib/format";
import type { ServiceId } from "@/types";

/** A care search, kept in the URL so Results and Profile can share it. */
export interface CareSearch {
  service: ServiceId;
  petId: string;
  area: string;
  from: string;
  to: string;
}

/** Defaults: no pet chosen yet (screens fall back to the first pet), dates a few days out. */
export function defaultSearch(): CareSearch {
  const today = todayISO();
  return { service: "walking", petId: "", area: "N9A", from: addDays(today, 3), to: addDays(today, 5) };
}

function isService(value: string | null): value is ServiceId {
  return SERVICES.some((s) => s.id === value);
}

export function readSearch(params: URLSearchParams): CareSearch {
  const fallback = defaultSearch();
  const service = params.get("service");
  return {
    service: isService(service) ? service : fallback.service,
    petId: params.get("pet") ?? fallback.petId,
    area: params.get("area") ?? fallback.area,
    from: params.get("from") ?? fallback.from,
    to: params.get("to") ?? fallback.to,
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

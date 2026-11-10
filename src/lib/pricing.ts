import type { ServiceId } from "@/types";

/** Overnight services are charged per night; the rest once per day. */
const OVERNIGHT: ServiceId[] = ["boarding", "sitting"];

export const MAX_BOOKING_DAYS = 30;

function daysBetween(start: string, end: string): number {
  return Math.round((Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86_400_000);
}

export interface PriceEstimate {
  units: number;
  total: number;
}

/**
 * Estimate shown before sending a request. Must match public.price_booking() in
 * supabase/migrations/0002_booking_requests.sql, which sets the real total.
 */
export function estimatePrice(service: ServiceId, rate: number, start: string, end: string): PriceEstimate | null {
  if (!start || !end || end < start) return null;
  const span = daysBetween(start, end);
  const units = OVERNIGHT.includes(service) ? Math.max(span, 1) : span + 1;
  return { units, total: rate * units };
}

export function bookingLength(start: string, end: string): number {
  return daysBetween(start, end);
}

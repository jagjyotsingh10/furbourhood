import { Dog, DoorOpen, Footprints, House, Sun, type LucideIcon } from "lucide-react";

import type { BookingStatus, CareNeed, ServiceId, SkillLevel } from "@/types";

export interface ServiceInfo {
  id: ServiceId;
  label: string;
  hint: string;
  icon: LucideIcon;
}

export const SERVICES: ServiceInfo[] = [
  { id: "walking", label: "Dog walking", hint: "In your neighbourhood", icon: Footprints },
  { id: "drop-in", label: "Drop-in visits", hint: "Quick visits at home", icon: DoorOpen },
  { id: "sitting", label: "Pet sitting", hint: "Overnight at your home", icon: House },
  { id: "boarding", label: "Boarding", hint: "Overnight at their home", icon: Dog },
  { id: "daycare", label: "Daycare", hint: "Daytime at their home", icon: Sun },
];

export function serviceInfo(id: ServiceId): ServiceInfo {
  return SERVICES.find((s) => s.id === id) ?? SERVICES[0]!;
}

export const NEED_LABELS: Record<CareNeed, string> = {
  "senior-care": "Senior care",
  "oral-medication": "Oral medication",
  injections: "Injections",
  anxiety: "Anxiety",
  "puppy-training": "Puppy training",
  "reactive-dog": "Reactive dog",
  "special-diet": "Special diet",
  "cat-care": "Cat care",
};

export const LEVEL_LABELS: Record<SkillLevel, string> = {
  "self-declared": "Self-declared",
  verified: "Verified",
  proven: "Proven",
};

export const LEVEL_DESCRIPTIONS: Record<SkillLevel, string> = {
  "self-declared": "Listed by the provider, not yet checked",
  verified: "Checked by Furbourhood in person",
  proven: "Confirmed by 3+ owners",
};

export const STATUS_LABELS: Record<BookingStatus, string> = {
  requested: "Requested",
  accepted: "Accepted",
  paid: "Paid",
  completed: "Completed",
};

/** Windsor-Essex areas used in the demo, keyed by postal code prefix */
export const AREAS: Record<string, string> = {
  N9A: "Downtown Windsor",
  N8X: "Central Windsor",
  N9G: "South Windsor",
  N8N: "Tecumseh",
  N9J: "LaSalle",
  N9V: "Amherstburg",
};

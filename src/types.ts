export type SkillLevel = "self-declared" | "verified" | "proven";

export type ServiceId = "walking" | "drop-in" | "sitting" | "boarding" | "daycare";

export type CareNeed =
  | "senior-care"
  | "oral-medication"
  | "injections"
  | "anxiety"
  | "puppy-training"
  | "reactive-dog"
  | "special-diet"
  | "cat-care";

export type BrandTone = "navy" | "sky" | "mint" | "coral";

export type BookingStatus = "requested" | "accepted" | "paid" | "completed";

export interface Area {
  name: string;
  /** First three characters of the postal code (forward sortation area), e.g. N9A */
  fsa: string;
}

export interface ProviderSkill {
  need: CareNeed;
  level: SkillLevel;
}

export interface ProviderService {
  service: ServiceId;
  rate: number;
  unit: string;
}

export interface Review {
  id: string;
  author: string;
  petName: string;
  rating: number;
  date: string;
  text: string;
}

export interface Provider {
  id: string;
  name: string;
  tone: BrandTone;
  area: Area;
  verifiedInPerson: boolean;
  rating: number;
  reviewCount: number;
  yearsExperience: number;
  featured: boolean;
  bio: string;
  skills: ProviderSkill[];
  services: ProviderService[];
  /** Only for providers who host pets in their own home (boarding, daycare, sitting) */
  hostCapacity?: string;
  reviews: Review[];
}

export interface Pet {
  id: string;
  name: string;
  species: "Dog" | "Cat";
  breed: string;
  ageYears: number;
  weightKg: number;
  tone: BrandTone;
  needs: CareNeed[];
}

export interface Booking {
  id: string;
  providerId: string;
  petId: string;
  service: ServiceId;
  start: string;
  end: string;
  status: BookingStatus;
  total: number;
}

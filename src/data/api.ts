/**
 * All Supabase reads live here. Each function maps database rows (snake_case)
 * onto the app types in src/types.ts, so screens and components never see raw rows.
 */
import { supabase } from "@/lib/supabase";
import type {
  Booking,
  BookingStatus,
  BrandTone,
  CareNeed,
  Pet,
  Provider,
  ServiceId,
  SkillLevel,
  UserRole,
} from "@/types";

// ---------------------------------------------------------------------------
// Row shapes returned by the selects below
// ---------------------------------------------------------------------------
interface ProviderRow {
  id: string;
  name: string;
  tone: BrandTone;
  area_name: string;
  area_fsa: string;
  verified_in_person: boolean;
  rating: number | string;
  review_count: number;
  years_experience: number;
  featured: boolean;
  bio: string;
  host_capacity: string | null;
  provider_skills?: { need: CareNeed; level: SkillLevel }[];
  provider_services?: { service: ServiceId; rate: number | string; unit: string }[];
  reviews?: {
    id: string;
    author_name: string;
    pet_name: string;
    rating: number;
    review_date: string;
    body: string;
  }[];
}

interface PetRow {
  id: string;
  name: string;
  species: "Dog" | "Cat";
  breed: string;
  age_years: number;
  weight_kg: number | string;
  tone: BrandTone;
  needs: CareNeed[];
}

interface BookingRow {
  id: string;
  provider_id: string;
  pet_id: string;
  service: ServiceId;
  start_date: string;
  end_date: string;
  status: BookingStatus;
  total: number | string;
  providers: ProviderRow | null;
  pets: PetRow | null;
}

interface ProfileRow {
  id: string;
  role: UserRole;
  full_name: string;
  area_fsa: string | null;
}

// ---------------------------------------------------------------------------
// Mapping
// ---------------------------------------------------------------------------
const PROVIDER_BASE =
  "id, name, tone, area_name, area_fsa, verified_in_person, rating, review_count, years_experience, featured, bio, host_capacity";
const PROVIDER_FULL = `${PROVIDER_BASE}, provider_skills(need, level), provider_services(service, rate, unit), reviews(id, author_name, pet_name, rating, review_date, body)`;
const PET_FIELDS = "id, name, species, breed, age_years, weight_kg, tone, needs";

const LEVEL_ORDER: Record<SkillLevel, number> = { proven: 0, verified: 1, "self-declared": 2 };

function toProvider(row: ProviderRow): Provider {
  return {
    id: row.id,
    name: row.name,
    tone: row.tone,
    area: { name: row.area_name, fsa: row.area_fsa },
    verifiedInPerson: row.verified_in_person,
    rating: Number(row.rating),
    reviewCount: row.review_count,
    yearsExperience: row.years_experience,
    featured: row.featured,
    bio: row.bio,
    hostCapacity: row.host_capacity ?? undefined,
    skills: [...(row.provider_skills ?? [])].sort((a, b) => LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level]),
    services: (row.provider_services ?? []).map((s) => ({ service: s.service, rate: Number(s.rate), unit: s.unit })),
    reviews: [...(row.reviews ?? [])]
      .sort((a, b) => b.review_date.localeCompare(a.review_date))
      .map((r) => ({
        id: r.id,
        author: r.author_name,
        petName: r.pet_name,
        rating: r.rating,
        date: r.review_date,
        text: r.body,
      })),
  };
}

function toPet(row: PetRow): Pet {
  return {
    id: row.id,
    name: row.name,
    species: row.species,
    breed: row.breed,
    ageYears: row.age_years,
    weightKg: Number(row.weight_kg),
    tone: row.tone,
    needs: row.needs,
  };
}

function fail(message: string): never {
  throw new Error(message);
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------
export async function fetchProviders(): Promise<Provider[]> {
  const { data, error } = await supabase.from("providers").select(PROVIDER_FULL).order("name");
  if (error) fail(error.message);
  return (data as unknown as ProviderRow[]).map(toProvider);
}

export async function fetchProvider(id: string): Promise<Provider | null> {
  const { data, error } = await supabase.from("providers").select(PROVIDER_FULL).eq("id", id).maybeSingle();
  if (error) fail(error.message);
  return data ? toProvider(data as unknown as ProviderRow) : null;
}

export async function fetchPets(): Promise<Pet[]> {
  const { data, error } = await supabase.from("pets").select(PET_FIELDS).order("created_at");
  if (error) fail(error.message);
  return (data as unknown as PetRow[]).map(toPet);
}

export async function fetchPet(id: string): Promise<Pet | null> {
  const { data, error } = await supabase.from("pets").select(PET_FIELDS).eq("id", id).maybeSingle();
  if (error) fail(error.message);
  return data ? toPet(data as unknown as PetRow) : null;
}

/** What the Add / Edit pet form saves. owner_id is filled in by the database (auth.uid()). */
export type PetInput = Omit<Pet, "id">;

function toPetRow(input: PetInput) {
  return {
    name: input.name,
    species: input.species,
    breed: input.breed,
    age_years: input.ageYears,
    weight_kg: input.weightKg,
    tone: input.tone,
    needs: input.needs,
  };
}

export async function createPet(input: PetInput): Promise<Pet> {
  const { data, error } = await supabase.from("pets").insert(toPetRow(input)).select(PET_FIELDS).single();
  if (error) fail(error.message);
  return toPet(data as unknown as PetRow);
}

export async function updatePet(id: string, input: PetInput): Promise<Pet> {
  // A pet edited by its owner is no longer demo data.
  const { data, error } = await supabase
    .from("pets")
    .update({ ...toPetRow(input), is_demo: false })
    .eq("id", id)
    .select(PET_FIELDS)
    .single();
  if (error) fail(error.message);
  return toPet(data as unknown as PetRow);
}

/** Deleting a pet also deletes its bookings (on delete cascade). */
export async function deletePet(id: string): Promise<void> {
  const { error } = await supabase.from("pets").delete().eq("id", id);
  if (error) fail(error.message);
}

export async function countPetBookings(id: string): Promise<number> {
  const { count, error } = await supabase.from("bookings").select("id", { count: "exact", head: true }).eq("pet_id", id);
  if (error) fail(error.message);
  return count ?? 0;
}

export interface BookingDetails {
  booking: Booking;
  provider: Provider;
  pet: Pet;
}

export async function fetchBookings(): Promise<BookingDetails[]> {
  const { data, error } = await supabase
    .from("bookings")
    .select(
      `id, provider_id, pet_id, service, start_date, end_date, status, total, providers(${PROVIDER_BASE}), pets(${PET_FIELDS})`,
    )
    .order("start_date");
  if (error) fail(error.message);

  return (data as unknown as BookingRow[]).flatMap((row) => {
    if (!row.providers || !row.pets) return [];
    return [
      {
        booking: {
          id: row.id,
          providerId: row.provider_id,
          petId: row.pet_id,
          service: row.service,
          start: row.start_date,
          end: row.end_date,
          status: row.status,
          total: Number(row.total),
        },
        provider: toProvider(row.providers),
        pet: toPet(row.pets),
      },
    ];
  });
}

export interface Profile {
  id: string;
  role: UserRole;
  fullName: string;
  areaFsa: string | null;
}

export async function fetchProfile(): Promise<Profile | null> {
  const { data, error } = await supabase.from("profiles").select("id, role, full_name, area_fsa").maybeSingle();
  if (error) fail(error.message);
  if (!data) return null;
  const row = data as ProfileRow;
  return { id: row.id, role: row.role, fullName: row.full_name, areaFsa: row.area_fsa };
}

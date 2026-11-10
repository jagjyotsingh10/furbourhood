/**
 * All Supabase reads live here. Each function maps database rows (snake_case)
 * onto the app types in src/types.ts, so screens and components never see raw rows.
 */
import { todayISO } from "@/lib/format";
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
  provider_unavailable_dates?: { day: string }[];
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
const PROVIDER_FULL = `${PROVIDER_BASE}, provider_skills(need, level), provider_services(service, rate, unit), reviews(id, author_name, pet_name, rating, review_date, body), provider_unavailable_dates(day)`;
// Only upcoming blocked dates matter; past ones are left out of every provider query.
const UNAVAILABLE_FROM = "provider_unavailable_dates.day";
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
    unavailable: (row.provider_unavailable_dates ?? []).map((u) => u.day).sort(),
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
  const { data, error } = await supabase
    .from("providers")
    .select(PROVIDER_FULL)
    .gte(UNAVAILABLE_FROM, todayISO())
    .order("name");
  if (error) fail(error.message);
  return (data as unknown as ProviderRow[]).map(toProvider);
}

export async function fetchProvider(id: string): Promise<Provider | null> {
  const { data, error } = await supabase
    .from("providers")
    .select(PROVIDER_FULL)
    .eq("id", id)
    .gte(UNAVAILABLE_FROM, todayISO())
    .maybeSingle();
  if (error) fail(error.message);
  return data ? toProvider(data as unknown as ProviderRow) : null;
}

/** The signed-in owner's pets. Filtered by owner: providers can also see pets from requests sent to them. */
export async function fetchPets(userId: string): Promise<Pet[]> {
  const { data, error } = await supabase.from("pets").select(PET_FIELDS).eq("owner_id", userId).order("created_at");
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

export interface BookingRequest {
  providerId: string;
  petId: string;
  service: ServiceId;
  start: string;
  end: string;
}

/** Sends a request. The database fills in owner, status ('requested') and the total. */
export async function requestBooking(request: BookingRequest): Promise<string> {
  const { data, error } = await supabase
    .from("bookings")
    .insert({
      provider_id: request.providerId,
      pet_id: request.petId,
      service: request.service,
      start_date: request.start,
      end_date: request.end,
    })
    .select("id")
    .single();
  if (error) fail(error.message);
  return (data as { id: string }).id;
}

/** Withdraws a booking that is still 'requested'. Fails if the provider has already replied. */
export async function withdrawBooking(id: string): Promise<void> {
  const { data, error } = await supabase.from("bookings").delete().eq("id", id).eq("status", "requested").select("id");
  if (error) fail(error.message);
  if (!data || data.length === 0) fail("This request can't be withdrawn any more. The provider may have replied.");
}

export interface BookingDetails {
  booking: Booking;
  provider: Provider;
  pet: Pet;
}

/** Bookings the signed-in user made as an owner (providers see theirs through fetchProviderRequests). */
export async function fetchBookings(userId: string): Promise<BookingDetails[]> {
  const { data, error } = await supabase
    .from("bookings")
    .select(
      `id, provider_id, pet_id, service, start_date, end_date, status, total, providers(${PROVIDER_BASE}), pets(${PET_FIELDS})`,
    )
    .eq("owner_id", userId)
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

/** Always filter by id: providers can also see the profiles of owners who sent them requests. */
export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, role, full_name, area_fsa")
    .eq("id", userId)
    .maybeSingle();
  if (error) fail(error.message);
  if (!data) return null;
  const row = data as ProfileRow;
  return { id: row.id, role: row.role, fullName: row.full_name, areaFsa: row.area_fsa };
}

// ---------------------------------------------------------------------------
// Provider tools
// ---------------------------------------------------------------------------
export async function fetchMyListing(userId: string): Promise<Provider | null> {
  const { data, error } = await supabase
    .from("providers")
    .select(PROVIDER_FULL)
    .eq("user_id", userId)
    .gte(UNAVAILABLE_FROM, todayISO())
    .maybeSingle();
  if (error) fail(error.message);
  return data ? toProvider(data as unknown as ProviderRow) : null;
}

/** What the My listing form saves. Verification, featured, rating and skill levels are set by the database. */
export interface ListingInput {
  name: string;
  tone: BrandTone;
  areaName: string;
  areaFsa: string;
  bio: string;
  yearsExperience: number;
  hostCapacity: string;
  services: { service: ServiceId; rate: number; unit: string }[];
  needs: CareNeed[];
}

/**
 * Creates or updates the signed-in provider's listing, then syncs services and skills.
 * Skills are diffed (not replaced) so existing Verified / Proven levels are never lost.
 */
export async function saveListing(userId: string, existing: Provider | null, input: ListingInput): Promise<string> {
  const row = {
    name: input.name,
    tone: input.tone,
    area_name: input.areaName,
    area_fsa: input.areaFsa,
    bio: input.bio,
    years_experience: input.yearsExperience,
    host_capacity: input.hostCapacity || null,
  };

  let id = existing?.id;
  if (id) {
    const { error } = await supabase.from("providers").update(row).eq("id", id);
    if (error) fail(error.message);
  } else {
    const { data, error } = await supabase
      .from("providers")
      .insert({ ...row, user_id: userId })
      .select("id")
      .single();
    if (error) fail(error.message);
    id = (data as { id: string }).id;
  }

  const chosen = input.services.map((s) => s.service);
  const removedServices = (existing?.services ?? []).map((s) => s.service).filter((s) => !chosen.includes(s));
  if (removedServices.length > 0) {
    const { error } = await supabase.from("provider_services").delete().eq("provider_id", id).in("service", removedServices);
    if (error) fail(error.message);
  }
  if (input.services.length > 0) {
    const { error } = await supabase
      .from("provider_services")
      .upsert(input.services.map((s) => ({ provider_id: id, service: s.service, rate: s.rate, unit: s.unit })));
    if (error) fail(error.message);
  }

  const had = (existing?.skills ?? []).map((s) => s.need);
  const removedNeeds = had.filter((n) => !input.needs.includes(n));
  const addedNeeds = input.needs.filter((n) => !had.includes(n));
  if (removedNeeds.length > 0) {
    const { error } = await supabase.from("provider_skills").delete().eq("provider_id", id).in("need", removedNeeds);
    if (error) fail(error.message);
  }
  if (addedNeeds.length > 0) {
    // Level is forced to 'self-declared' by the database.
    const { error } = await supabase.from("provider_skills").insert(addedNeeds.map((need) => ({ provider_id: id, need })));
    if (error) fail(error.message);
  }

  return id;
}

export interface RequestDetails {
  booking: Booking;
  pet: Pet;
  ownerName: string;
}

interface RequestRow extends Omit<BookingRow, "providers"> {
  owner: { full_name: string } | null;
}

export async function fetchProviderRequests(listingId: string): Promise<RequestDetails[]> {
  const { data, error } = await supabase
    .from("bookings")
    .select(
      `id, provider_id, pet_id, service, start_date, end_date, status, total, pets(${PET_FIELDS}), owner:profiles!bookings_owner_profile_fkey(full_name)`,
    )
    .eq("provider_id", listingId)
    .order("start_date");
  if (error) fail(error.message);

  return (data as unknown as RequestRow[]).flatMap((row) => {
    if (!row.pets) return [];
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
        pet: toPet(row.pets),
        ownerName: row.owner?.full_name || "A pet owner",
      },
    ];
  });
}

/**
 * Provider moves a booking on: answer a request, or mark accepted / paid care as completed.
 * `from` guards against acting on a stale screen; the database enforces the allowed steps.
 */
export async function updateBookingStatus(
  id: string,
  from: BookingStatus[],
  to: "accepted" | "declined" | "completed",
): Promise<void> {
  const { data, error } = await supabase
    .from("bookings")
    .update({ status: to })
    .eq("id", id)
    .in("status", from)
    .select("id");
  if (error) fail(error.message);
  if (!data || data.length === 0) fail("This booking has changed since you opened it. Refresh and try again.");
}

/** Saves the provider's blocked dates by adding and removing only what changed. */
export async function saveUnavailableDates(listingId: string, before: string[], after: string[]): Promise<void> {
  const removed = before.filter((d) => !after.includes(d));
  const added = after.filter((d) => !before.includes(d));
  if (removed.length > 0) {
    const { error } = await supabase
      .from("provider_unavailable_dates")
      .delete()
      .eq("provider_id", listingId)
      .in("day", removed);
    if (error) fail(error.message);
  }
  if (added.length > 0) {
    const { error } = await supabase
      .from("provider_unavailable_dates")
      .insert(added.map((day) => ({ provider_id: listingId, day })));
    if (error) fail(error.message);
  }
}

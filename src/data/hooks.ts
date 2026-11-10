import { useAuth } from "@/auth/AuthProvider";
import {
  countPetBookings,
  fetchBookings,
  fetchHostSpace,
  fetchMyListing,
  fetchPet,
  fetchPets,
  fetchProfile,
  fetchProvider,
  fetchProviderRequests,
  fetchProviders,
} from "@/data/api";
import { useQuery } from "@/data/useQuery";

// Keys include the user id so data never leaks between accounts after a log-out/log-in.
function useUserKey(name: string) {
  const { user } = useAuth();
  return `${name}:${user?.id ?? "anon"}`;
}

export const useProviders = () => useQuery(useUserKey("providers"), fetchProviders);
export const useProvider = (id: string) => useQuery(useUserKey(`provider:${id}`), () => fetchProvider(id));
export function usePets() {
  const { user } = useAuth();
  return useQuery(useUserKey("pets"), () => (user ? fetchPets(user.id) : Promise.resolve([])));
}
export const usePet = (id: string) => useQuery(useUserKey(`pet:${id}`), () => fetchPet(id));
export const usePetBookingCount = (id: string) =>
  useQuery(useUserKey(`pet-bookings:${id}`), () => countPetBookings(id));
export function useBookings() {
  const { user } = useAuth();
  return useQuery(useUserKey("bookings"), () => (user ? fetchBookings(user.id) : Promise.resolve([])));
}
export function useProfile() {
  const { user } = useAuth();
  return useQuery(useUserKey("profile"), () => (user ? fetchProfile(user.id) : Promise.resolve(null)));
}

export function useMyListing() {
  const { user } = useAuth();
  return useQuery(useUserKey("my-listing"), () => (user ? fetchMyListing(user.id) : Promise.resolve(null)));
}

export const useProviderRequests = (listingId: string) =>
  useQuery(useUserKey(`requests:${listingId}`), () => fetchProviderRequests(listingId));

export const useHostSpace = (providerId: string, from: string, to: string) =>
  useQuery(useUserKey(`host-space:${providerId}:${from}:${to}`), () => fetchHostSpace(providerId, from, to));

import { useAuth } from "@/auth/AuthProvider";
import { fetchBookings, fetchPets, fetchProfile, fetchProvider, fetchProviders } from "@/data/api";
import { useQuery } from "@/data/useQuery";

// Keys include the user id so data never leaks between accounts after a log-out/log-in.
function useUserKey(name: string) {
  const { user } = useAuth();
  return `${name}:${user?.id ?? "anon"}`;
}

export const useProviders = () => useQuery(useUserKey("providers"), fetchProviders);
export const useProvider = (id: string) => useQuery(useUserKey(`provider:${id}`), () => fetchProvider(id));
export const usePets = () => useQuery(useUserKey("pets"), fetchPets);
export const useBookings = () => useQuery(useUserKey("bookings"), fetchBookings);
export const useProfile = () => useQuery(useUserKey("profile"), fetchProfile);

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";

import { fetchProfile, type Profile } from "@/data/api";
import { supabase } from "@/lib/supabase";
import type { UserRole } from "@/types";

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  /** Owner or provider. Null while signed out or still loading. */
  role: UserRole | null;
  /** True until the saved session (and its profile, if any) has been read */
  loading: boolean;
}

const AuthContext = createContext<AuthState>({ session: null, user: null, profile: null, role: null, loading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileFor, setProfileFor] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setSessionReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setSessionReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const userId = session?.user.id ?? null;

  // Load the profile (and so the role) whenever a different user signs in.
  useEffect(() => {
    if (!userId) {
      setProfile(null);
      setProfileFor(null);
      return;
    }
    let cancelled = false;
    fetchProfile(userId)
      .catch(() => null)
      .then((result) => {
        if (cancelled) return;
        setProfile(result);
        setProfileFor(userId);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const loading = !sessionReady || (userId !== null && profileFor !== userId);

  return (
    <AuthContext.Provider
      value={{ session, user: session?.user ?? null, profile, role: profile?.role ?? null, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

/** Where a signed-in user lands: providers on their requests, owners on Find care. */
export function homeFor(role: UserRole | null): string {
  return role === "provider" ? "/requests" : "/find";
}

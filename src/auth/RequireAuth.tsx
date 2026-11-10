import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { useAuth } from "@/auth/AuthProvider";
import { PhoneFrame } from "@/components/AppShell";
import { LoadingState } from "@/components/States";

/** Sends signed-out visitors to Log in, then back to the page they wanted. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <PhoneFrame>
        <LoadingState className="pt-32" />
      </PhoneFrame>
    );
  }
  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }
  return <>{children}</>;
}

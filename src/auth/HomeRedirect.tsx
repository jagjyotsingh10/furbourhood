import { Navigate } from "react-router-dom";

import { homeFor, useAuth } from "@/auth/AuthProvider";

/** /home: sends staff to the dashboard, providers to their requests and owners to Find care. Rendered inside RequireAuth. */
export function HomeRedirect() {
  const { role, isAdmin } = useAuth();
  return <Navigate to={homeFor(role, isAdmin)} replace />;
}

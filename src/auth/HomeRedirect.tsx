import { Navigate } from "react-router-dom";

import { homeFor, useAuth } from "@/auth/AuthProvider";

/** /home: sends providers to their requests and owners to Find care. Rendered inside RequireAuth. */
export function HomeRedirect() {
  const { role } = useAuth();
  return <Navigate to={homeFor(role)} replace />;
}

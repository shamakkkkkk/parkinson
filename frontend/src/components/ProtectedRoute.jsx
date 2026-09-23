import { Redirect } from "wouter";
import { useAuth } from "../context/AuthContext";

/** Wraps a page component and redirects to /login when not authenticated. */
export default function ProtectedRoute({ component: Component, ...rest }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  return <Component {...rest} />;
}

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { authApi } from "../api/authApi";
import { getSession, setSession as persistSession } from "../api/session";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // React state exists only so the UI re-renders on login/logout; the
  // actual token used for API calls is always read straight from
  // sessionStorage (see api/session.js) so there's no dependency on effect
  // timing between this provider and its descendants.
  const [session, setSessionState] = useState(() => getSession());

  const login = useCallback(async (username, password) => {
    const result = await authApi.login(username, password);
    persistSession(result);
    setSessionState(result);
    return result;
  }, []);

  const signup = useCallback(async (payload) => {
    await authApi.signup(payload);
  }, []);

  const logout = useCallback(() => {
    persistSession(null);
    setSessionState(null);
  }, []);

  const value = useMemo(
    () => ({
      user: session?.user ?? null,
      isAuthenticated: Boolean(session?.accessToken),
      login,
      signup,
      logout,
    }),
    [session, login, signup, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

/**
 * Single source of truth for the current auth session (JWT + user profile),
 * backed by sessionStorage.
 *
 * This is deliberately NOT React state. `client.js` needs to read the
 * current token synchronously on every outgoing request, including ones
 * fired from a `useEffect` on the very first render after login/reload.
 * An earlier version wired this up via a `registerTokenGetter()` callback
 * that `AuthContext` set inside its own `useEffect` - but React commits a
 * child component's effects before its parent's, so a descendant
 * (`AppStateContext`) firing its own "load data" effect could run before
 * `AuthContext`'s effect had registered the real token getter, sending the
 * very first request after login with no Authorization header at all.
 * Reading/writing storage directly here removes that race: by the time
 * `AuthContext.login()` returns, the token is already on disk and every
 * consumer (regardless of effect ordering) sees it.
 */
const STORAGE_KEY = "moves.auth";

export function getSession() {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setSession(session) {
  try {
    if (session) {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } else {
      window.sessionStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // sessionStorage may be unavailable (e.g. private browsing) - the
    // session just won't survive a reload in that case.
  }
}

export function getToken() {
  return getSession()?.accessToken ?? null;
}

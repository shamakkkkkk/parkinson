# MOVES Experiment Console (frontend)

React/Vite app used by experimenters to register candidates, run recording
sessions, and review results for the Parkinson's movement/speech study.

## What changed in this refactor

- **Design system**: the previous ~1400-line ad-hoc stylesheet plus
  inline `style={{...}}` scattered across every component has been replaced
  with a token-based design system in `src/index.css` (colors, spacing,
  type scale as CSS variables) and a small set of reusable primitives in
  `src/components/ui/` (`Button`, `FormField`, `Badge`, `EmptyState`,
  `Loading`, `Banner`, `ConfirmModal`, `PageHeader`). No component now sets
  its own colors/spacing inline.
- **Real authentication**: `LoginPage` / `SignupPage` previously did zero
  network calls - "logging in" was just client-side field validation
  followed by a redirect, completely disconnected from the backend's actual
  `/auth/login` and `/users` endpoints. They now call the real API, store
  the JWT in `sessionStorage` via `AuthContext`, and every other route is
  wrapped in `ProtectedRoute` so an unauthenticated visitor is sent to
  `/login`. The token is read/written through `api/session.js` directly
  (not via a React-effect-registered callback) so the very first API call
  after login/reload always has it - an earlier version registered the
  token getter inside a `useEffect`, and because React commits a child
  component's effects before its parent's, a descendant's "load data"
  effect could fire before the token was registered, sending that request
  with no `Authorization` header.
- **Single source of truth for data**: a candidate *is* an experiment on
  the data platform. The previous app kept a second, parallel "sessions"
  list in `localStorage` that tried to track the same information and could
  drift out of sync with the backend (a real bug: closing the tab mid-session
  could leave `localStorage` and the backend disagreeing about which
  exercises existed). That layer, and the `localCreatedCandidates` /
  `sessions` localStorage hacks, are gone - the backend response is the only
  copy of the data.
- **No more fabricated chart data**: `CustomMetricGraph` used to invent
  random sample points via `Math.random()` whenever no real backend data was
  present, which is actively misleading in a clinical data-visualization
  tool. `GraphCard` now shows a plain "No data recorded yet" state instead.
- **`window.alert` / `window.confirm` replaced** with a toast system
  (`ToastContext`) and an actual confirmation dialog (`ConfirmModal`) for
  destructive actions like deleting a candidate.
- **No more 1.5s polling loop**: the candidate list previously refetched
  every 1.5 seconds unconditionally, all the time. Now the app fetches once
  on load and re-fetches after a mutation (create/delete/complete) instead.
- **`SessionControlPage`** (554 lines mixing timers, backend sync, and
  rendering) is now a thin layout component; the recording lifecycle lives
  in `src/hooks/useExerciseRecorder.js` so it can be reasoned about (and
  tested) on its own.
- **Data calls go through the backend, authenticated**: the API client now
  attaches the logged-in user's JWT to every request and talks to myBackend
  (`/data/...`), instead of calling the experiment-api service directly and
  unauthenticated as before.
- **`PATCH /experiments/:id` replaces `properties` wholesale, it does not
  merge** (confirmed against `experiment-api`'s implementation). An earlier
  version of `markCandidateCompleted` sent only `{completed, completedAt}`,
  which would have silently erased every other property (room, notes,
  parkinsonsStatus, gender, ...) on the experiment. It now fetches the
  experiment first and merges client-side before writing back. **Any new
  code that calls `updateExperiment` must do the same** - never send a
  partial `properties` object expecting the server to merge it for you.
- **Error messages**: myBackend's own errors use `{message}`, but errors
  proxied straight through from `experiment-api` use `{error}` (see its
  `openapi.yaml` `Error` schema) - `api/client.js` checks both, otherwise
  every proxied 404/409 showed a generic "Request failed with status ###"
  instead of the real reason.
- **Pagination**: the data platform caps `pageSize` at 100 per request;
  `refreshCandidates` now pages through everything instead of silently
  truncating past the first 100 experiments.

## Setup

`.env.local` (pointing at myBackend on `http://localhost:3001`) is already
included in this copy.

```bash
npm install
npm run dev
```

You'll need `myBackend` (and, behind it, `experiment-api`) running - see
their READMEs.

## Structure

```
src/
  api/            fetch client + auth/experiment API modules
  components/     pages (one file per route) + AppLayout
  components/ui/  reusable, unstyled-by-usage primitives
  context/        AuthContext, AppStateContext, ToastContext
  hooks/          useExerciseRecorder (recording lifecycle)
  utils/          pure helpers (candidate filters, metric series, age calc)
```

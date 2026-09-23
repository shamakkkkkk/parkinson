# MOVES — Experiment Console for Parkinson's Movement & Speech Research

A full-stack clinical research tool built for a university project (SRH
Berlin, *Software Engineering Cross Platform Applications*) supporting a
real study into the link between movement and speech in Parkinson's
disease. Experimenters use it to register participants, run structured
recording sessions, and review the resulting sensor data.

**Author:** Shamil Mustafin

**Email:** [shamil.mustafin.main@gmail.com](mailto:shamil.mustafin.main@gmail.com)


---

## Overview

The study asks participants to walk a marked distance under three
conditions — normal, large, and extra-large steps — while speaking the
syllable "Ba" on every step, to test whether step size correlates with
vocal amplitude and mouth-opening in Parkinson's patients. This app is the
tool an experimenter uses to run that protocol: start/stop each recording,
annotate it, and review step-length, sound-pressure, and mouth-opening
data afterward.

## Architecture

Three services, each with a single responsibility:

```
┌─────────────┐   HTTPS + JWT    ┌─────────────┐    server-to-server    ┌────────────────┐
│  Frontend   │ ───────────────► │  myBackend  │ ─────────────────────► │  experiment-api │
│  React/Vite │ ◄─────────────── │   NestJS    │ ◄───────────────────── │     Express     │
│   :5173     │                  │    :3001    │                        │      :3000      │
└─────────────┘                  └─────────────┘                        └────────────────┘
   UI / state                  auth + authenticated                   sensor data storage
                                     proxy layer                        (stub/simulated)
```

- The browser only ever talks to **myBackend**; it never sees
  `experiment-api` directly.
- **myBackend** issues and verifies JWTs and forwards authenticated
  requests to the data-platform service.
- **experiment-api** is a stub of the real sensor pipeline (built to spec
  by a separate team on the project), storing experiments/exercises and
  returning generated placeholder sensor data.

## Highlights

A few things worth pointing out beyond "it works":

- **Auth done properly**: JWT signed with a secret from environment
  config (never hardcoded), passwords hashed with bcrypt, and a signup
  endpoint that can't be used to self-assign privileged roles.
- **Single source of truth**: the frontend holds no duplicate/derived
  state that can drift from the backend — every screen reflects what the
  API actually returns, no client-side caches invented to work around API
  gaps.
- **Handles a real API quirk correctly**: the data platform's `PATCH`
  endpoint replaces nested objects wholesale rather than merging them —
  the client fetches-then-merges before writing, instead of silently
  losing data on every update (verified against the upstream OpenAPI spec,
  not just assumed).
- **No fabricated data**: results only ever show what was actually
  recorded; a metric with nothing recorded shows an explicit empty state
  rather than a misleading placeholder chart.
- **Small, testable units**: recording logic lives in a single hook
  (`useExerciseRecorder`) instead of being tangled into a page component,
  with unit tests on the backend for the auth and user-creation logic.

## Tech stack

| Layer | Stack |
|---|---|
| Frontend | React, Vite, Wouter (routing), Recharts, plain CSS with a token-based design system |
| Backend | NestJS, Passport + JWT, bcrypt, class-validator |
| Data service | Express, OpenAPI 3, Scalar docs |

## Getting started

Run all three services (separate terminals):

```bash
# 1. sensor data stub
cd experiment-api && npm install && npm start          # :3000

# 2. auth + proxy backend
cd myBackend && npm install && npm run seed:admin && npm run start:dev   # :3001

# 3. frontend
cd frontend && npm install && npm run dev               # :5173
```

Open `http://localhost:5173` and log in with `admin` / `ChangeMe123!`
(created by `seed:admin` — override via `SEED_USERNAME`/`SEED_PASSWORD`,
see `myBackend/README.md`). Environment files for local development are
already included in each service.

## Project structure

```
.
├── frontend/         React console — candidates, sessions, results
│   └── README.md     component/state architecture
├── myBackend/         NestJS auth + authenticated proxy
│   └── README.md     API surface, env vars, setup
└── experiment-api/    Sensor-data service stub (spec-driven, built to a shared OpenAPI contract)
```

Each service's own README covers its internals in more depth; this file
is the map.

## Possible next steps

- Persist users in a real database instead of a JSON file.
- Refresh tokens / shorter-lived access tokens.
- Let an experimenter add exercises to an already-completed session.
- CSV/PDF export of results for offline analysis.
- Docker Compose to bring all three services up with one command.

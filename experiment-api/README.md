# Experiment API

A REST API for managing experiments and exercises in a research study investigating
the relationship between language and movement in Parkinson's candidates.

## Quick start

```bash
npm install       # install dependencies (Express)
npm start         # start the server on http://localhost:3000
```

Then open:

- **API documentation (Scalar):** <http://localhost:3000/docs> — includes a built-in
  **"Try it"** console for sending live requests to the running server.
- **Raw OpenAPI spec:** <http://localhost:3000/openapi.yaml>

Set a different port with the `PORT` environment variable, e.g. `PORT=8080 npm start`
(on Windows PowerShell: `$env:PORT=8080; npm start`).

> **Note:** The server uses **in-memory storage** and ships **stub endpoints** — all
> data is lost on restart, and recorded sensor data is randomly generated when a
> recording is stopped. This is enough to exercise every route and render the docs; a
> real datastore and sensor integration come later.

## API Routes

The API is organized around two resources: **experiments** (the umbrella entity) and
**exercises** (individual recording steps that belong to an experiment).

### Experiments

| Method   | Path                        | Description                                                                 |
|----------|-----------------------------|-----------------------------------------------------------------------------|
| `POST`   | `/experiments`              | Create a new experiment (test-person data, custom properties). Created date is set by the server. |
| `GET`    | `/experiments`              | List experiments, paginated (`page`, `pageSize` query params).              |
| `GET`    | `/experiments/{experimentId}` | Get a single experiment by id.                                            |
| `PATCH`  | `/experiments/{experimentId}` | Update an experiment (partial update of test-person data / properties).   |
| `DELETE` | `/experiments/{experimentId}` | Delete an experiment and **all** related exercises and data.             |

**Experiment fields:** `id`, `candidateNumber`, `height`, `age`, `weight`,
`createdAt`, `properties` (string→string key-value map).

### Exercises

| Method   | Path                                          | Description                                                        |
|----------|-----------------------------------------------|-------------------------------------------------------------------|
| `POST`   | `/experiments/{experimentId}/exercises`       | Create a new exercise within an experiment (custom properties). Created date set by server. |
| `GET`    | `/experiments/{experimentId}/exercises`       | List all exercises of one experiment.                             |
| `GET`    | `/exercises`                                  | List all exercises (across experiments), paginated.               |
| `GET`    | `/exercises/{exerciseId}`                      | Get a single exercise (metadata + recording status).             |
| `DELETE` | `/exercises/{exerciseId}`                      | Delete an exercise completely.                                    |

**Exercise fields:** `id`, `experimentId`, `createdAt`, `properties`,
`recordingStatus` (`idle` | `recording` | `stopped`), `hasData` (boolean),
`recordingStartedAt`, `recordingEndedAt` (ISO 8601, nullable).

### Recording control & data (sub-resources of an exercise)

| Method   | Path                                         | Description                                                                 |
|----------|----------------------------------------------|-----------------------------------------------------------------------------|
| `POST`   | `/exercises/{exerciseId}/recording/start`    | Start data recording. Fails (`409 Conflict`) if the exercise already has data. |
| `POST`   | `/exercises/{exerciseId}/recording/stop`     | Stop data recording.                                                        |
| `GET`    | `/exercises/{exerciseId}/data`               | Get recorded + processed data for the exercise (see payload below).         |
| `DELETE` | `/exercises/{exerciseId}/data`               | Clear recorded exercise data (resets `hasData`, allows a new recording).     |

**Exercise data payload (`GET /exercises/{exerciseId}/data`)** — grouped by signal
type, with recording start/end timestamps:

```jsonc
{
  "exerciseId": "…",
  "startedAt": "2026-07-01T10:00:00.000Z",   // recording start timestamp
  "endedAt":   "2026-07-01T10:03:00.000Z",   // recording end timestamp

  "mouthOpening": {
    "values": [[0.12, 0.30], …],             // [vertical, horizontal], relative to frame size
    "sampleRate": 30                          // Hz
  },
  "soundPressure": {
    "values": [63.2, …],
    "unit": "dB",                             // "Pa" or "dB"
    "sampleRate": 48000
  },
  "footSpeed": {
    "values": [12.4, …],
    "unit": "cm/s",
    "sampleRate": 100
  },
  "aggregates": {
    "stepLengths": { "values": [45.1, …], "unit": "cm" },
    "averages":    { "mouthOpeningVertical": …, "soundPressure": …, "footSpeed": …, "stepLength": … },
    "medians":     { "mouthOpeningVertical": …, "soundPressure": …, "footSpeed": …, "stepLength": … }
  }
}
```

### Documentation

| Method | Path            | Description                                    |
|--------|-----------------|------------------------------------------------|
| `GET`  | `/openapi.yaml` | The raw OpenAPI 3.x specification.             |
| `GET`  | `/docs`         | Scalar-rendered API documentation with a live "Try it" console. |

## Design notes / open questions

- **Recording as sub-resource vs. state field:** start/stop are modeled as actions
  (`POST .../recording/start|stop`). Alternatively they could be a single
  `PATCH /exercises/{id}` toggling a status field. I went with explicit action routes
  for clarity.
- **"Clear data" via `DELETE .../data`** keeps the exercise but removes its recording,
  so a new recording can be started afterwards. `DELETE /exercises/{id}` removes the
  whole exercise.
- **Listing exercises:** provided both nested (`/experiments/{id}/exercises`) and flat
  (`/exercises`) since the requirements say "List all exercises" without scoping.
- **Update method:** `PATCH` (partial) is proposed for experiments; could be `PUT`
  (full replace) if you prefer.

## Project layout

```
openapi.yaml   OpenAPI 3.0 specification (source of truth for the API)
server.js      Express server: serves the spec, Scalar docs (with try-it), and stub endpoints
package.json   Dependencies and npm scripts
README.md      This file
```
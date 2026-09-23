# myBackend

The application layer between the React frontend and the experiment-api /
data-platform service. It owns authentication (JWT) and proxies authenticated
data requests through to the sensor/data platform, matching the architecture
described in the project briefing (React -> NestJS auth guard -> Data
Platform).

## What changed in this refactor

- **Config & secrets**: the JWT secret was previously a hardcoded string
  (`SECRET_KEY_2026`) committed to the repo, duplicated in two files. It's
  now read from `JWT_SECRET` via `@nestjs/config` (see `.env.example`); the
  app refuses to boot in production without it.
- **Security fix**: `POST /users` (sign-up) let a client set their own
  `roles`, including `roles: ["admin"]` - an unauthenticated privilege
  escalation bug. New accounts are now always created with the `user` role;
  role changes must go through an admin-only path.
- **Dead code removed**: `experiments/` (an in-memory `candidate/session/trial`
  domain model) was never called by the frontend or wired to anything - it
  duplicated, incompatibly, the real `experiment/exercise` model implemented
  by the `experiment-api` service. It has been removed rather than left as
  unused, confusing code.
- **Duplicate file structure flattened**: Nest CLI had generated
  `guards/jwt-auth/jwt-auth.guard.ts` *and* a `guards/jwt-auth.guard.ts` that
  just re-exported it (same pattern for the other guards and both DTOs).
  Each of these is now a single file.
- **Proxy is now actually used and authenticated**: requests under
  `PROXY_PREFIX` (default `/data`) are forwarded to `PROXY_TARGET`
  (the `experiment-api` service) only if the caller sends a valid
  `Authorization: Bearer <jwt>` header. Previously the proxy existed but
  nothing required a token, and the frontend didn't use it at all (it talked
  to the data platform directly, bypassing this backend's auth entirely).
- **Consistent error responses**: a global exception filter now turns every
  error (validation, auth, unhandled) into the same `{ statusCode, message,
  path, timestamp }` shape instead of leaking stack traces for unexpected
  errors.
- **CORS** is explicitly configured (`CORS_ORIGINS`) instead of left unset.

## Setup

This copy already ships with a `.env` pre-filled with a randomly generated
`JWT_SECRET`, so it runs as-is. If you regenerate the project or put it
under version control, treat `.env` as a secret and generate a fresh one:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

```bash
npm install
npm run start:dev
# -> http://localhost:3001
```

Create your first user - there's no committed seed data (`users.json` is
gitignored, since it holds password hashes), so run the seed script once:

```bash
npm run seed:admin
# -> creates username "admin", password "ChangeMe123!"
```

Override the defaults if you want:

```bash
SEED_USERNAME=jane SEED_PASSWORD='something-strong' SEED_FULLNAME='Jane Doe' SEED_EMAIL=jane@example.com npm run seed:admin
```

Or create a user over HTTP instead, once the server is running:

```bash
curl -X POST http://localhost:3001/users \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"a-strong-password","fullName":"Admin User","emailAddress":"admin@example.com"}'
```

Then log in:

```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"a-strong-password"}'
```

## Environment variables

See `.env.example` for the full list (`PORT`, `JWT_SECRET`, `JWT_EXPIRES_IN`,
`CORS_ORIGINS`, `PROXY_TARGET`, `PROXY_PREFIX`, `PROXY_TIMEOUT_MS`).

## API surface

| Method | Path          | Auth             | Description                                 |
| ------ | ------------- | ---------------- | -------------------------------------------- |
| GET    | `/health`     | none              | Liveness check                               |
| POST   | `/auth/login` | none              | Returns a JWT + user profile                 |
| POST   | `/users`      | none              | Sign up (always role `user`)                 |
| DELETE | `/users/:id`  | JWT + role admin  | Remove a user                                |
| ANY    | `/data/*`     | JWT               | Proxied to `PROXY_TARGET` (experiment-api)   |

## Known limitation worth raising with the data-platform team

`experiment-api` has no `PATCH /exercises/:id` endpoint, so an exercise's
`properties` (e.g. an experimenter's annotation) can only be set at creation
time, not after a recording is stopped - even though the project briefing
describes annotating *after* stopping the recording. The frontend works
around this by keeping the annotation in the UI until an exercise is created,
then sending it as part of the creation payload. This is exactly the kind of
interface gap the briefing calls out under "Technical Coordination with the
API Working Group" - flagging it here for that conversation.

## Tests

```bash
npm run test
npm run test:cov
```

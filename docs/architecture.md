# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

Record your plan here before editing code.

- Presentation tier decision: Keep page rendering and user interaction in React components, and use the shared API client for all requests. Each capability should show loading, empty, and error states accessibly.
- Logic tier decision: Keep HTTP handling and request validation in Express routes, with persistence and capability rules in the TypeScript service layer. Return deliberate 4xx responses for invalid or unknown input rather than leaking database cast errors.
- Data tier decision: Define required fields, types, and references in the Mongoose models. Preserve the existing seed behavior and make any seed changes idempotent.
- Activity tracking approach: Validate `userId` and `teamId` before creating a record, confirm both referenced documents exist, and store the submitted type and minutes with computed points and an occurrence timestamp.
- Team management approach: Require a name and mascot, preserve both in create/list responses, and store members as user references. Reject a missing name with `400`.
- Leaderboard approach: Sum activity points by team, return each team's name and total, sort highest first, and assign ranks starting at 1.
- Workout suggestions approach: Find the user by email, use their fitness goal and recent activity to choose a relevant suggestion, and include a reason. Return a deliberate 4xx when no user matches.

Implementation order:

1. Complete model schemas and validation; keep the passing idempotent seed contract intact. Run the data-tier tests.
2. Implement service behavior and Express endpoints against those models, covering activity creation/listing, team creation/listing, leaderboard ranking, and workout recommendations. Run the API tests.
3. Implement the React capability views using the shared API client, including loading, empty, and error states. Run the frontend tests.
4. Run both builds to catch TypeScript and bundling issues across the completed tiers.

## Test plan

Record the commands you run and what each failure means.

- Data-tier command: `npm run test:data --prefix octofit-tracker/backend` — failures indicate model fields, validation, references, or seed behavior violate the data contract.
- API command: `npm run test:api --prefix octofit-tracker/backend` — failures indicate endpoint status codes, validation, persistence, computed results, or response shapes violate the API contract.
- Frontend command: `npm test --prefix octofit-tracker/frontend` — failures indicate rendering, API usage, request selection, or loading/empty/error states violate the presentation contract.
- Backend build command: `npm run build --prefix octofit-tracker/backend` — failures indicate backend TypeScript compilation or type contracts are invalid.
- Frontend build command: `npm run build --prefix octofit-tracker/frontend` — failures indicate frontend TypeScript compilation or Vite bundling is invalid.

# Development

## Prerequisites

- **Node 24+** and **Yarn 4** (managed via Corepack). The pinned version is in
  [`.nvmrc`](../.nvmrc).
- A Twenty instance to sync against — either the local dev container or a remote.

```bash
corepack enable
yarn install
```

## Project layout

See [architecture.md](architecture.md) for the full map. New entities should be
scaffolded with the CLI so identifiers are generated correctly:

```bash
yarn twenty dev:add object|field|logicFunction|view|navigationMenuItem|index|role
```

## Local loop

```bash
# Start a throwaway local Twenty (Docker) and connect to it
yarn twenty docker:start
yarn twenty remote:add --local

# Build, generate the typed API client, sync, and hot-reload
yarn twenty dev

# Inspect / invoke the function
yarn twenty dev:function:logs -n cal-webhook
yarn twenty dev:function:exec -n cal-webhook -p '{
  "triggerEvent": "BOOKING_CREATED",
  "payload": {
    "uid": "dev-1",
    "title": "Test",
    "startTime": "2026-07-01T10:00:00Z",
    "endTime": "2026-07-01T10:30:00Z",
    "attendees": [{ "email": "a@b.com", "name": "A B" }]
  }
}'
```

To sync to a specific remote instead of local:

```bash
yarn twenty remote:add --url https://your-twenty.example.com --api-key "$TWENTY_API_KEY" --as prod
yarn twenty -r prod dev
```

## Quality gates

| Command | Checks |
| --- | --- |
| `yarn lint` | oxlint |
| `yarn twenty dev:typecheck` | app TypeScript |
| `yarn tsc -p tsconfig.spec.json --noEmit` | test TypeScript |
| `yarn test:unit` | pure‑logic unit tests (no server) |
| `yarn test:integration` | end‑to‑end against a running Twenty |

### Tests

- **Unit tests** (`src/**/*.test.ts`, config `vitest.unit.config.ts`) mock the
  API client and require no server. This is where the webhook's signature,
  parsing, mapping, and upsert logic are covered.
- **Integration tests** (`src/**/*.integration-test.ts`, config `vitest.config.ts`)
  spin up the app against a live Twenty (the scaffold's `global-setup`), so they
  need `TWENTY_API_URL` / `TWENTY_API_KEY` and a reachable server.

## Continuous integration

[`.github/workflows/ci.yml`](../.github/workflows/ci.yml) runs on every push to
`main` and every PR:

- **`unit` job** — lint, typecheck (app + tests), and unit tests. No server.
- **`test` job** — spawns a Twenty instance and runs the integration tests.

## Publishing a release

The app is distributed on npm; Twenty's marketplace syncs published packages
hourly. Releases are automated by
[`.github/workflows/release.yml`](../.github/workflows/release.yml), which runs on
a published GitHub Release and executes `yarn twenty app:publish`.

**One‑time setup:** add an `NPM_TOKEN` repository secret (an npm automation token
with publish rights to the package).

To cut a release:

```bash
# 1. bump the version (semver — the server rejects re-publishing the same version)
npm version patch        # or minor / major

# 2. push the tag, then publish a GitHub Release for it
git push --follow-tags
gh release create vX.Y.Z --generate-notes
```

Or publish manually:

```bash
npm login
yarn twenty app:publish              # add --tag beta for a pre-release
yarn twenty dev:catalog-sync         # optional: force an immediate catalog refresh
```

Keep `version` in [`package.json`](../package.json) and an entry in
[`CHANGELOG.md`](../CHANGELOG.md) in step with each release.

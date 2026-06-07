# Security

## Threat model

The webhook route is publicly reachable and unauthenticated at the transport
layer (`isAuthRequired: false`). The trust boundary is the **shared signing
secret** (`CAL_WEBHOOK_SECRET`). Anyone without it can only elicit a `4xx`/`5xx`;
no data is read or written.

## Controls

### Authentication — HMAC signature verification
Every request must carry `x-cal-signature-256` equal to
`HMAC_SHA256(CAL_WEBHOOK_SECRET, rawBody)`. Verification:

- runs **before** any database access — a bad signature returns `401` and the API
  client is never even constructed;
- uses a constant‑time comparison with a length guard;
- is computed over the exact signed bytes (base64 transport is decoded first), and
  the body is parsed from those same bytes.

### Fail‑closed
If `CAL_WEBHOOK_SECRET` is unset, the function returns `500` and does nothing —
it never falls back to accepting unsigned requests.

### Secret handling
`CAL_WEBHOOK_SECRET` is a **secret** application variable, injected only into the
function's `process.env`. It is never logged, never returned in a response, and
never exposed to front‑end components.

### Input hardening
With a valid signature the payload is still treated as untrusted:

- **Size cap** — bodies over 64 KB are rejected with `413` before parsing.
- **Field truncation** — `name`/title (500), person names (255), `meetingUrl`
  (2048) are bounded before they are written.
- **Email validation** — a `Person` is only matched/created for a syntactically
  valid, length‑bounded email; junk values are skipped.
- **URL scheme check** — `meetingUrl` is only stored when it is `http(s)`.
- **No injection** — all writes use the parameterized GraphQL client (selection
  objects with bound arguments), never string‑concatenated queries.
- **No prototype pollution** — parsed JSON is read field‑by‑field; attacker keys
  are never spread or merged into shared objects.

### Integrity of state
- Bookings are keyed on a **unique** `calBookingUid`, so replays/retries can't
  create duplicates.
- Status transitions are **monotonic** for terminal states: a `COMPLETED` booking
  is never downgraded by a stale or replayed event.

### Error handling
Unexpected errors are caught and returned as a generic `500` (no stack trace, no
secret), which also signals Cal.com to retry.

## Residual risks (accepted)

- **Replay.** Cal.com's signing covers only the body (no timestamp/nonce), so a
  captured valid delivery can be replayed. Impact is bounded by idempotent upsert,
  the unique index, and monotonic status — a replay re‑applies the same state.
- **Secret holder abuse.** Anyone holding `CAL_WEBHOOK_SECRET` can create/link
  `Person` and `Booking` records. Treat the secret as a credential: rotate it in
  both Twenty and Cal.com if you suspect exposure.

## Reporting a vulnerability

Please report security issues privately to **hello@roekish.com** rather than
opening a public issue. We aim to acknowledge within a few business days.

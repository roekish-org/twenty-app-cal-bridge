<div align="center">

# Cal bridge

**Connect [Cal.com](https://cal.com) directly to your [Twenty](https://twenty.com) CRM.**

A signed Cal.com webhook is received by a serverless function *inside* Twenty,
which upserts a `Booking` record and links the attendee `Person`.
No Zapier, no n8n, no glue server to operate.

[![CI](https://github.com/roekish-org/twenty-app-cal-bridge/actions/workflows/ci.yml/badge.svg)](https://github.com/roekish-org/twenty-app-cal-bridge/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/twenty-app-cal-bridge)](https://www.npmjs.com/package/twenty-app-cal-bridge)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

</div>

---

## Why

Most Cal.com → CRM setups route bookings through a third-party automation tool
(Zapier, Make, n8n). That means another moving part to host, secure, and pay for.
Cal bridge runs the integration as a native Twenty application: the webhook
handler is a serverless function the Twenty server already operates, so the only
infrastructure is Twenty itself.

## Features

- **`Booking` object** — `startsAt`, `endsAt`, `meetingUrl`, `status`,
  `calBookingUid`, plus `reminder24hSent` / `reminderDaySent` flags for your own
  reminder automations.
- **Person linking** — every booking links to a `Person` (matched by email,
  created if new); each person shows their `Bookings`.
- **Signed & verified** — every delivery is checked with HMAC‑SHA256 against your
  secret; forgeries are rejected with `401`.
- **Idempotent** — upserts by `calBookingUid` behind a unique index, so retries,
  reschedules, and cancellations update the same record instead of duplicating.
- **Hardened** — body‑size cap, field truncation, email validation, monotonic
  status, and fail‑closed error handling. See [docs/security.md](docs/security.md).
- **Bookings view** in the sidebar out of the box.

## Quick start (end users)

1. In Twenty, open **Settings → Applications** and install **Cal bridge**.
2. Open the app → **Variables** and set **`CAL_WEBHOOK_SECRET`** to a strong
   random string (you'll reuse it in step 4).
3. Copy the webhook route shown on the app's page — it looks like
   `https://<your-twenty>/functions/<app>/cal/webhook`.
4. In **Cal.com → Settings → Developer → Webhooks → New**:
   - **Subscriber URL** = the route from step 3
   - **Secret** = the same value as `CAL_WEBHOOK_SECRET`
   - **Triggers** = Booking Created, Rescheduled, Cancelled, Rejected, Meeting Ended
5. Send a test ping — a `Booking` appears under the **Bookings** view.

Full walkthrough: [docs/configuration.md](docs/configuration.md).

### Status mapping

| Cal.com `triggerEvent`                              | `Booking.status` |
| --------------------------------------------------- | ---------------- |
| `BOOKING_CREATED` / `REQUESTED` / `RESCHEDULED` / `PAID` | `SCHEDULED`  |
| `BOOKING_CANCELLED` / `REJECTED`                    | `CANCELLED`      |
| `MEETING_ENDED`                                     | `COMPLETED`      |

Updates never overwrite `reminder24hSent` / `reminderDaySent`, and a `COMPLETED`
booking is never downgraded by a later event.

## Documentation

| Doc | Contents |
| --- | --- |
| [Architecture](docs/architecture.md) | How the pieces fit, the data flow, the upsert/idempotency design |
| [Configuration](docs/configuration.md) | Install, the webhook secret, Cal.com setup, field mapping |
| [Webhook reference](docs/webhooks.md) | Payloads handled, signature scheme, HTTP responses, reschedule logic |
| [Security](docs/security.md) | Threat model, verification, input hardening, reporting |
| [Development](docs/development.md) | Local setup, tests, CI, publishing & versioning |
| [Troubleshooting](docs/troubleshooting.md) | Common issues and fixes |

## Development at a glance

Requires **Node 24+** and **Yarn 4**.

```bash
yarn install
yarn test:unit          # pure-logic unit tests (no server needed)
yarn lint
yarn twenty dev:typecheck
yarn twenty dev         # build + sync to a connected Twenty instance
```

See [docs/development.md](docs/development.md) for the full loop, integration
tests, and publishing.

## Contributing

Issues and pull requests are welcome — see [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE) © Roekish

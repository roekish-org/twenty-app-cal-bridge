# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project follows
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2026-06-07

### Added
- `Booking` object (`startsAt`, `endsAt`, `meetingUrl`, `status`, `calBookingUid`,
  `reminder24hSent`, `reminderDaySent`).
- `pointOfContact` relation from `Booking` to `Person`, with the inverse
  `bookings` relation on `Person`.
- Unique index on `calBookingUid` for race‑safe upserts.
- `cal-webhook` logic function: HMAC‑verified `POST /cal/webhook` that upserts a
  booking by `calBookingUid`, maps Cal.com events to statuses, and links the
  attendee `Person`.
- `CAL_WEBHOOK_SECRET` secret application variable.
- Bookings table view and sidebar navigation item.
- Unit test suite and a server‑backed integration test.
- CI workflow (lint, typecheck, unit + integration tests) and a release workflow
  that publishes to npm on a GitHub Release.

### Security
- Signature verification before any database access; fail‑closed when the secret
  is unset.
- Input hardening: 64 KB body cap, field truncation, email validation, `http(s)`
  URL check.
- Monotonic status (a `COMPLETED` booking is never downgraded).
- Generic error responses (no secret or stack‑trace leakage).

[Unreleased]: https://github.com/roekish-org/twenty-app-cal-bridge/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/roekish-org/twenty-app-cal-bridge/releases/tag/v1.0.0

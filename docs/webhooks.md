# Webhook reference

The `cal-webhook` logic function exposes one route:

```
POST /functions/<app>/cal/webhook
```

It is declared with `isAuthRequired: false` (Cal.com can't send a Twenty session)
and is instead protected by HMAC signature verification.

## Signature scheme

Cal.com signs each delivery and sends:

```
x-cal-signature-256: <hex HMAC-SHA256(secret, rawBody)>
```

The function computes `HMAC_SHA256(CAL_WEBHOOK_SECRET, rawBody)` over the **exact
bytes received** and compares it to the header in constant time. Notes:

- The comparison is case‑insensitive on the hex digest and tolerant of
  surrounding whitespace.
- A length check precedes the constant‑time compare (so it never throws on a
  malformed header).
- If the transport delivered a base64‑encoded body, it is decoded back to the
  signed bytes before verification.
- The body is parsed **after** verification, from the same verified bytes — never
  from a pre‑parsed payload — so the function only ever acts on what was signed.

## Handled events

| `triggerEvent` | Effect |
| --- | --- |
| `BOOKING_CREATED`, `BOOKING_REQUESTED`, `BOOKING_RESCHEDULED`, `BOOKING_PAID` | upsert booking, `status = SCHEDULED` |
| `BOOKING_CANCELLED`, `BOOKING_REJECTED` | upsert booking, `status = CANCELLED` |
| `MEETING_ENDED` | upsert booking, `status = COMPLETED` |
| any other value | acknowledged with `200 { "ignored": "<event>" }`, no write |

## Example payload

```json
{
  "triggerEvent": "BOOKING_CREATED",
  "payload": {
    "uid": "abc123",
    "title": "Audit call between Acme and Roekish",
    "startTime": "2026-07-01T10:00:00Z",
    "endTime": "2026-07-01T10:30:00Z",
    "attendees": [
      { "email": "lead@acme.com", "name": "Ada Lovelace", "timeZone": "Europe/Paris" }
    ],
    "organizer": { "email": "sales@roekish.com", "name": "Roekish" },
    "videoCallData": { "url": "https://meet.example/abc123" }
  }
}
```

## Responses

| Status | When | Body |
| --- | --- | --- |
| `200` | booking upserted, or event ignored | `{ "ok": true, "bookingId", "status", "triggerEvent" }` or `{ "ignored": "<event>" }` |
| `400` | empty body, malformed JSON, or missing `payload.uid` | `{ "error": "..." }` |
| `401` | missing or invalid signature | `{ "error": "invalid signature" }` |
| `413` | body larger than 64 KB | `{ "error": "payload too large" }` |
| `500` | secret not configured, or an unexpected error | `{ "error": "..." }` |

Responses never include the secret, stack traces, or request internals. Any non‑2xx
prompts Cal.com to retry.

## Reschedule handling

When Cal.com issues a reschedule under a **new** `uid`, the delivery typically
includes `rescheduleUid` (the previous uid). The function looks up the existing
booking by the new `uid` first, then by `rescheduleUid`, and updates that record
in place rather than creating a duplicate.

## Idempotency & retries

Bookings are keyed on `calBookingUid`, which is unique (DB index). Re‑deliveries,
retries, and concurrent duplicates all converge on a single record:

- A second create for the same `uid` fails the unique constraint; the function
  catches it, re‑reads the row, and updates it.
- A replayed terminal event can't regress status (`COMPLETED` stays `COMPLETED`).

# Architecture

Cal bridge is a [Twenty application](https://docs.twenty.com/developers/extend/apps)
— a versioned bundle of schema, logic, and UI defined in TypeScript and installed
into a workspace. Everything runs inside the Twenty server; there is no external
service to operate.

## Data flow

```
Cal.com                Twenty server                         Twenty data
   │                        │                                      │
   │  POST /cal/webhook     │                                      │
   │  (signed JSON body)    │                                      │
   ├───────────────────────►│                                      │
   │                        │  cal-webhook logic function          │
   │                        │  1. verify HMAC-SHA256 signature      │
   │                        │  2. parse the signed bytes            │
   │                        │  3. find/create Person by email  ────►│  Person
   │                        │  4. upsert Booking by calBookingUid ─►│  Booking
   │                        │     (linked to the Person)           │
   │   200 / 4xx / 5xx      │                                      │
   │◄───────────────────────┤                                      │
```

A non‑2xx response tells Cal.com to retry, so transient failures don't lose data.

## Components

| File | Responsibility |
| --- | --- |
| `src/application-config.ts` | App identity, marketplace metadata, and the `CAL_WEBHOOK_SECRET` application variable |
| `src/objects/booking.object.ts` | The `Booking` object and its fields |
| `src/indexes/cal-booking-uid-unique.index.ts` | Unique index on `calBookingUid` (makes upsert race‑safe) |
| `src/fields/point-of-contact-on-booking.field.ts` | `Booking → Person` relation (`pointOfContact`) |
| `src/fields/bookings-on-person.field.ts` | Inverse `Person → Booking` relation (`bookings`) |
| `src/logic-functions/cal-webhook.ts` | The HTTP webhook handler and upsert logic |
| `src/views/bookings.view.ts` | Default table view for browsing bookings |
| `src/navigation-menu-items/bookings.navigation-menu-item.ts` | Sidebar entry for the view |
| `src/default-role.ts` | The role granted to the app's functions (read + create/update) |

Entities are auto‑discovered from the `src/` subfolders; there is no central
manifest array to keep in sync.

## Identity & multi‑tenancy

Every entity carries a stable `universalIdentifier` (UUID v4). On install,
Twenty namespaces the app's objects/fields under the install's own
`applicationId`, so the same bundle can be installed into many workspaces without
identifier collisions. Each install is fully independent: its own `Booking`
object, its own `CAL_WEBHOOK_SECRET`, its own webhook route.

## Upsert & idempotency

The handler keys every booking on Cal.com's stable `calBookingUid`:

1. Look up an existing booking by `calBookingUid` (and by `rescheduleUid` when a
   reschedule arrives under a new uid).
2. If found, **update**; otherwise **create**.
3. A unique index on `calBookingUid` guarantees that two concurrent deliveries
   can't both create a row — the loser hits a unique violation, which the handler
   catches and converts into an update.

Status is reconciled, not blindly overwritten: a `COMPLETED` booking is never
moved back to `SCHEDULED` by a late or replayed event.

## What the handler deliberately does *not* touch

`reminder24hSent` and `reminderDaySent` are owned by your reminder automations,
not by Cal bridge. The webhook never writes them, so a later booking update can't
re‑arm a reminder that already fired.

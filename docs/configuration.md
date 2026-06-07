# Configuration

## 1. Install the app

**Settings → Applications → Cal bridge → Install.** Installing provisions the
`Booking` object, its fields, the `Person` relation, the unique index, the
Bookings view, and the `cal-webhook` function.

> If your workspace already has an object named `booking`, install fails — object
> names are unique. Rename or remove the existing one first. See
> [troubleshooting](troubleshooting.md#booking-name-collision).

## 2. Set the webhook secret

Open the app → **Variables** and set:

| Variable | Required | Description |
| --- | --- | --- |
| `CAL_WEBHOOK_SECRET` | yes | The signing secret shared with Cal.com. The function rejects any delivery whose `x-cal-signature-256` header doesn't match an HMAC‑SHA256 of the body using this secret. |

`CAL_WEBHOOK_SECRET` is declared as a **secret** application variable, so its
value is injected only into the logic function's `process.env` — it is never
exposed to front‑end components or returned in any response.

Choose a strong random value, e.g.:

```bash
openssl rand -hex 32
```

## 3. Get the webhook URL

The app page shows the function's public route. It has the shape:

```
https://<your-twenty-host>/functions/<app>/cal/webhook
```

Use the exact value shown — the `<app>` segment is install‑specific.

## 4. Create the Cal.com webhook

> Don't have a Cal.com account yet? Create one with our referral link:
> **https://refer.cal.com/alexismaison-hydg**

**Cal.com → Settings → Developer → Webhooks → New:**

| Field | Value |
| --- | --- |
| Subscriber URL | the route from step 3 |
| Secret | the **same** value as `CAL_WEBHOOK_SECRET` |
| Event Triggers | Booking Created, Booking Rescheduled, Booking Cancelled, Booking Rejected, Meeting Ended |
| Payload template | default |

Save, then use **Ping** (or create a test booking) to verify a `Booking` appears
under the Bookings view.

## Field mapping

| Cal.com payload field | Booking field | Notes |
| --- | --- | --- |
| `payload.uid` | `calBookingUid` | upsert key; unique |
| `payload.title` | `name` | falls back to `Booking <uid>`; truncated to 500 chars |
| `payload.startTime` | `startsAt` | ISO‑8601 |
| `payload.endTime` | `endsAt` | ISO‑8601 |
| `payload.videoCallData.url` → `metadata.videoCallUrl` → `location` | `meetingUrl` | first `http(s)` value wins; truncated to 2048 chars |
| `triggerEvent` | `status` | see mapping below |
| `payload.attendees[0].email` (else `organizer.email`) | `pointOfContact` | matched to a `Person`, created if absent |

### Status mapping

| `triggerEvent` | `status` |
| --- | --- |
| `BOOKING_CREATED`, `BOOKING_REQUESTED`, `BOOKING_RESCHEDULED`, `BOOKING_PAID` | `SCHEDULED` |
| `BOOKING_CANCELLED`, `BOOKING_REJECTED` | `CANCELLED` |
| `MEETING_ENDED` | `COMPLETED` |
| anything else | ignored (acknowledged with `200`, no write) |

A booking already in `COMPLETED` is never moved back to `SCHEDULED`.

## Reminder flags

`reminder24hSent` and `reminderDaySent` default to `false` and are **never**
written by the webhook. Use them as the bookkeeping state for your own reminder
workflows (e.g. a scheduled automation that sets the flag once it sends).

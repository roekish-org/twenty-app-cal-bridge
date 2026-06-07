# Troubleshooting

## `401 invalid signature`

The `x-cal-signature-256` header didn't match.

- The **secret must be identical** in Cal.com and in the app's
  `CAL_WEBHOOK_SECRET` variable. Re‑paste both; watch for trailing whitespace.
- Make sure Cal.com is sending to the right route (the `<app>` segment is
  install‑specific — copy it from the app page).
- If you rotated the secret, update **both** sides.

## `500 webhook secret not configured`

`CAL_WEBHOOK_SECRET` is unset. Set it in **Settings → Applications → Cal bridge →
Variables** and retry.

## `413 payload too large`

The body exceeded 64 KB. This is a guard against abuse; legitimate Cal.com
booking payloads are far smaller. If you have a genuine need for larger bodies,
raise `MAX_BODY_BYTES` in `src/logic-functions/cal-webhook.ts` and republish.

## No booking appears, but Cal.com shows a 2xx

- Check the function logs: `yarn twenty dev:function:logs -n cal-webhook`.
- Confirm the `triggerEvent` is one of the handled events — others are
  acknowledged with `200 { "ignored": ... }` and intentionally write nothing.
- Confirm the **worker** is running. Twenty needs its worker container up for
  serverless functions and queues; if the admin panel shows "worker is down",
  bookings won't be processed.

## Booking has no linked Person

The function links by the first attendee's email (falling back to the organizer).
A `Person` is only matched/created when the email is syntactically valid. Invalid
or missing emails are skipped — the booking is still recorded, just unlinked.

## Booking name collision (install fails)

Twenty object names are unique per workspace. If a `booking` object already
exists (for example from a previous manual setup), the install fails. Remove or
rename the existing object first:

- **UI:** Settings → Data model → Bookings → Delete.
- **API:** delete the object metadata for `nameSingular: "booking"`.

Then install again — Cal bridge will create its own `booking` object.

## Wrong Node version

The SDK requires Node 24+. If `yarn twenty ...` errors on startup, check
`node -v` against [`.nvmrc`](../.nvmrc) and switch (`nvm use`, `fnm use`, or your
version manager of choice).

## `Package ... not found in the project` after renaming

If you change the package `name`, Yarn's workspace state goes stale. Run
`yarn install` once to refresh it.

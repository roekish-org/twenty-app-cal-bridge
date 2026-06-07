import { createHmac } from 'crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Capture the constructed CoreApiClient so each test can assert on its calls.
const lastClient = {
  value: null as null | { query: ReturnType<typeof vi.fn>; mutation: ReturnType<typeof vi.fn> },
};
vi.mock('twenty-client-sdk/core', () => ({
  CoreApiClient: vi.fn(() => lastClient.value),
}));

import {
  decodeRawBody,
  handler,
  isValidEmail,
  reconcileStatus,
  resolveMeetingUrl,
  splitName,
  STATUS_FOR_EVENT,
  truncate,
  upsertBooking,
  verifySignature,
} from './cal-webhook';
import { BookingStatus } from '../objects/booking.object';

const SECRET = 'super-secret-value';
const sign = (raw: string, secret = SECRET) =>
  createHmac('sha256', secret).update(raw, 'utf8').digest('hex');

const makeClient = (
  overrides: {
    personId?: string;
    bookingId?: string;
    existingBookingId?: string;
    existingStatus?: string;
  } = {},
) => {
  const query = vi.fn(async (selection: any) => {
    if (selection.people) {
      return { people: { edges: overrides.personId ? [{ node: { id: overrides.personId } }] : [] } };
    }
    if (selection.bookings) {
      return {
        bookings: {
          edges: overrides.existingBookingId
            ? [{ node: { id: overrides.existingBookingId, status: overrides.existingStatus } }]
            : [],
        },
      };
    }
    return {};
  });
  const mutation = vi.fn(async (selection: any) => {
    if (selection.createPerson) return { createPerson: { id: overrides.personId ?? 'new-person' } };
    if (selection.createBooking) return { createBooking: { id: overrides.bookingId ?? 'new-booking' } };
    if (selection.updateBooking) return { updateBooking: { id: selection.updateBooking.__args.id } };
    return {};
  });
  return { query, mutation };
};

const makeEvent = (body: object, signature?: string, opts: { isBase64Encoded?: boolean } = {}) => {
  const raw = JSON.stringify(body);
  const rawBody = opts.isBase64Encoded ? Buffer.from(raw, 'utf8').toString('base64') : raw;
  return {
    headers: { 'x-cal-signature-256': signature ?? sign(raw), 'content-type': 'application/json' },
    queryStringParameters: {},
    pathParameters: {},
    body: null,
    rawBody,
    isBase64Encoded: Boolean(opts.isBase64Encoded),
    requestContext: { http: { method: 'POST', path: '/cal/webhook' } },
    userWorkspaceId: null,
  } as any;
};

const created = (uid = 'cal-uid-1') => ({
  triggerEvent: 'BOOKING_CREATED',
  payload: {
    uid,
    title: 'Audit call',
    startTime: '2026-07-01T10:00:00Z',
    endTime: '2026-07-01T10:30:00Z',
    attendees: [{ email: 'Lead@Example.com', name: 'Ada Lovelace' }],
    videoCallData: { url: 'https://meet.example/abc' },
  },
});

beforeEach(() => {
  process.env.CAL_WEBHOOK_SECRET = SECRET;
  lastClient.value = makeClient({ personId: 'person-1' });
});
afterEach(() => {
  vi.clearAllMocks();
  delete process.env.CAL_WEBHOOK_SECRET;
});

describe('verifySignature', () => {
  it('accepts a correct signature', () => {
    const raw = JSON.stringify({ a: 1 });
    expect(verifySignature(raw, sign(raw), SECRET)).toBe(true);
  });
  it('is case-insensitive on the hex digest', () => {
    const raw = JSON.stringify({ a: 1 });
    expect(verifySignature(raw, sign(raw).toUpperCase(), SECRET)).toBe(true);
  });
  it('rejects a tampered body', () => {
    expect(verifySignature(JSON.stringify({ a: 2 }), sign(JSON.stringify({ a: 1 })), SECRET)).toBe(false);
  });
  it('rejects the wrong secret', () => {
    const raw = JSON.stringify({ a: 1 });
    expect(verifySignature(raw, sign(raw, 'other'), SECRET)).toBe(false);
  });
  it('rejects a missing signature or secret', () => {
    expect(verifySignature('{}', undefined, SECRET)).toBe(false);
    expect(verifySignature('{}', sign('{}'), undefined)).toBe(false);
  });
  it('does not throw on a length mismatch', () => {
    expect(verifySignature('{}', 'deadbeef', SECRET)).toBe(false);
  });
});

describe('pure helpers', () => {
  it('decodes base64 transport bodies', () => {
    const raw = '{"hi":1}';
    const b64 = Buffer.from(raw, 'utf8').toString('base64');
    expect(decodeRawBody({ rawBody: b64, isBase64Encoded: true })).toBe(raw);
    expect(decodeRawBody({ rawBody: raw, isBase64Encoded: false })).toBe(raw);
  });
  it('splits and caps names', () => {
    expect(splitName('Ada Lovelace')).toEqual({ firstName: 'Ada', lastName: 'Lovelace' });
    expect(splitName('  Cher  ')).toEqual({ firstName: 'Cher', lastName: '' });
    expect(splitName(undefined)).toEqual({ firstName: '', lastName: '' });
    expect(splitName('A'.repeat(400) + ' ' + 'B'.repeat(400)).firstName.length).toBe(255);
  });
  it('only accepts http(s) meeting urls', () => {
    expect(resolveMeetingUrl({ videoCallData: { url: 'https://x' } })).toBe('https://x');
    expect(resolveMeetingUrl({ location: 'In person' })).toBeUndefined();
    expect(resolveMeetingUrl({ metadata: { videoCallUrl: 'http://y' } })).toBe('http://y');
  });
  it('truncates strings', () => {
    expect(truncate('abcdef', 3)).toBe('abc');
    expect(truncate('ab', 3)).toBe('ab');
    expect(truncate(undefined, 3)).toBeUndefined();
  });
  it('validates email shape and length', () => {
    expect(isValidEmail('a@b.co')).toBe(true);
    expect(isValidEmail('not-an-email')).toBe(false);
    expect(isValidEmail('a@b')).toBe(false);
    expect(isValidEmail('a b@c.co')).toBe(false);
    expect(isValidEmail('a@' + 'x'.repeat(400) + '.co')).toBe(false);
    expect(isValidEmail(undefined)).toBe(false);
  });
  it('keeps COMPLETED bookings from being downgraded', () => {
    expect(reconcileStatus(BookingStatus.COMPLETED, BookingStatus.SCHEDULED)).toBe(BookingStatus.COMPLETED);
    expect(reconcileStatus(BookingStatus.SCHEDULED, BookingStatus.CANCELLED)).toBe(BookingStatus.CANCELLED);
    expect(reconcileStatus(undefined, BookingStatus.SCHEDULED)).toBe(BookingStatus.SCHEDULED);
  });
  it('maps events to statuses', () => {
    expect(STATUS_FOR_EVENT.BOOKING_CREATED).toBe(BookingStatus.SCHEDULED);
    expect(STATUS_FOR_EVENT.BOOKING_CANCELLED).toBe(BookingStatus.CANCELLED);
    expect(STATUS_FOR_EVENT.MEETING_ENDED).toBe(BookingStatus.COMPLETED);
    expect(STATUS_FOR_EVENT.FORM_SUBMITTED).toBeUndefined();
  });
});

describe('handler (transport)', () => {
  it('returns 500 when the secret is unset', async () => {
    delete process.env.CAL_WEBHOOK_SECRET;
    const res = await handler(makeEvent(created()));
    expect(res.statusCode).toBe(500);
  });
  it('returns 400 on an empty body', async () => {
    const res = await handler({ ...makeEvent({}), rawBody: '' });
    expect(res.statusCode).toBe(400);
    expect(lastClient.value?.mutation).not.toHaveBeenCalled();
  });
  it('returns 413 on an oversized body before doing any work', async () => {
    const big = { triggerEvent: 'BOOKING_CREATED', payload: { uid: 'x', title: 'A'.repeat(70_000) } };
    const res = await handler(makeEvent(big));
    expect(res.statusCode).toBe(413);
    expect(lastClient.value?.mutation).not.toHaveBeenCalled();
  });
  it('returns 401 on an invalid signature', async () => {
    const res = await handler(makeEvent(created(), 'badsignature'));
    expect(res.statusCode).toBe(401);
    expect(lastClient.value?.mutation).not.toHaveBeenCalled();
  });
  it('returns 400 on a malformed body that still matches its signature', async () => {
    const raw = 'not json';
    const res = await handler({ ...makeEvent({}, sign(raw)), rawBody: raw });
    expect(res.statusCode).toBe(400);
  });
  it('verifies a base64-encoded body end to end', async () => {
    const res = await handler(makeEvent(created(), undefined, { isBase64Encoded: true }));
    expect(res.statusCode).toBe(200);
  });
});

describe('upsertBooking (core)', () => {
  it('creates a booking and links an existing person', async () => {
    const client = makeClient({ personId: 'person-1', bookingId: 'bk-9' });
    const res = await upsertBooking(client, 'BOOKING_CREATED', created().payload);
    expect(res.statusCode).toBe(200);

    const createCall = client.mutation.mock.calls.find((c) => c[0].createBooking);
    expect(createCall).toBeTruthy();
    const data = createCall![0].createBooking.__args.data;
    expect(data).toMatchObject({
      calBookingUid: 'cal-uid-1',
      status: BookingStatus.SCHEDULED,
      startsAt: '2026-07-01T10:00:00Z',
      meetingUrl: 'https://meet.example/abc',
      pointOfContactId: 'person-1',
    });
    const personLookup = client.query.mock.calls.find((c) => c[0].people);
    expect(personLookup![0].people.__args.filter.emails.primaryEmail.eq).toBe('lead@example.com');
  });

  it('updates instead of creating when the uid already exists', async () => {
    const client = makeClient({ existingBookingId: 'bk-existing', personId: 'person-1' });
    const res = await upsertBooking(client, 'BOOKING_RESCHEDULED', created().payload);
    expect(res.statusCode).toBe(200);
    expect(client.mutation.mock.calls.some((c) => c[0].updateBooking)).toBe(true);
    expect(client.mutation.mock.calls.some((c) => c[0].createBooking)).toBe(false);
  });

  it('does not downgrade a COMPLETED booking on a later SCHEDULED event', async () => {
    const client = makeClient({ existingBookingId: 'bk-done', existingStatus: BookingStatus.COMPLETED });
    await upsertBooking(client, 'BOOKING_CREATED', created().payload);
    const updateCall = client.mutation.mock.calls.find((c) => c[0].updateBooking);
    expect(updateCall![0].updateBooking.__args.data.status).toBe(BookingStatus.COMPLETED);
  });

  it('creates a person when none exists', async () => {
    const client = makeClient({ bookingId: 'bk-1' });
    await upsertBooking(client, 'BOOKING_CREATED', created().payload);
    expect(client.mutation.mock.calls.some((c) => c[0].createPerson)).toBe(true);
  });

  it('does not create a person for an invalid attendee email', async () => {
    const client = makeClient({ bookingId: 'bk-1' });
    const payload = { ...created().payload, attendees: [{ email: 'not-an-email', name: 'X' }] };
    await upsertBooking(client, 'BOOKING_CREATED', payload);
    expect(client.mutation.mock.calls.some((c) => c[0].createPerson)).toBe(false);
    const createCall = client.mutation.mock.calls.find((c) => c[0].createBooking);
    expect(createCall![0].createBooking.__args.data.pointOfContactId).toBeUndefined();
  });

  it('falls back to update when create hits a unique-index race', async () => {
    let bookingLookups = 0;
    const client = makeClient();
    client.query.mockImplementation(async (selection: any) => {
      if (selection.people) return { people: { edges: [] } };
      if (selection.bookings) {
        bookingLookups += 1;
        // First lookup: none. After the create conflict: the racing row exists.
        return {
          bookings: {
            edges: bookingLookups === 1 ? [] : [{ node: { id: 'bk-raced', status: undefined } }],
          },
        };
      }
      return {};
    });
    client.mutation.mockImplementation(async (selection: any) => {
      if (selection.createBooking) throw new Error('duplicate key value violates unique constraint');
      if (selection.updateBooking) return { updateBooking: { id: selection.updateBooking.__args.id } };
      return {};
    });
    const res = await upsertBooking(client, 'BOOKING_CREATED', created().payload);
    expect(res.statusCode).toBe(200);
    const updateCall = client.mutation.mock.calls.find((c) => c[0].updateBooking);
    expect(updateCall![0].updateBooking.__args.id).toBe('bk-raced');
  });

  it('ignores unmapped events without writing', async () => {
    const client = makeClient();
    const res = await upsertBooking(client, 'FORM_SUBMITTED', created().payload);
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual({ ignored: 'FORM_SUBMITTED' });
    expect(client.mutation).not.toHaveBeenCalled();
  });

  it('rejects a payload with no uid', async () => {
    const client = makeClient();
    const res = await upsertBooking(client, 'BOOKING_CREATED', {});
    expect(res.statusCode).toBe(400);
    expect(client.mutation).not.toHaveBeenCalled();
  });

  it('still records the booking when person resolution fails', async () => {
    const client = makeClient({ bookingId: 'bk-2' });
    // Only the people lookup throws; the bookings lookup must still succeed.
    client.query.mockImplementation(async (selection: any) => {
      if (selection.people) throw new Error('boom');
      if (selection.bookings) return { bookings: { edges: [] } };
      return {};
    });
    const res = await upsertBooking(client, 'BOOKING_CREATED', created().payload);
    expect(res.statusCode).toBe(200);
    const createCall = client.mutation.mock.calls.find((c) => c[0].createBooking);
    expect(createCall![0].createBooking.__args.data.pointOfContactId).toBeUndefined();
  });
});

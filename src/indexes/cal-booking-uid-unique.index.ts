import { defineIndex } from 'twenty-sdk/define';
import {
  BOOKING_OBJECT_UNIVERSAL_IDENTIFIER,
  BOOKING_CAL_BOOKING_UID_FIELD_UNIVERSAL_IDENTIFIER,
} from '../objects/booking.object';

// Unique constraint on calBookingUid: makes the webhook upsert race-safe —
// two concurrent deliveries for the same booking can't both create a row
// (the loser hits a unique violation, which the function turns into an update).
export default defineIndex({
  universalIdentifier: '40013ca0-7be7-4776-bc6c-1be90044458c',
  objectUniversalIdentifier: BOOKING_OBJECT_UNIVERSAL_IDENTIFIER,
  isUnique: true,
  fields: [
    {
      universalIdentifier: '9a86214f-8027-4b67-afc9-1d7164fca8f5',
      fieldUniversalIdentifier: BOOKING_CAL_BOOKING_UID_FIELD_UNIVERSAL_IDENTIFIER,
    },
  ],
});

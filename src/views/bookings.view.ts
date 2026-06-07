import { defineView, ViewType, ViewKey } from 'twenty-sdk/define';
import { BOOKING_OBJECT_UNIVERSAL_IDENTIFIER } from '../objects/booking.object';

export const BOOKINGS_VIEW_UNIVERSAL_IDENTIFIER =
  '7c1f3b2a-9d44-4e6b-8f0a-2c5e7a9b1d33';

// Default index (table) view so the Booking object is browsable in the UI.
export default defineView({
  universalIdentifier: BOOKINGS_VIEW_UNIVERSAL_IDENTIFIER,
  name: 'All Bookings',
  objectUniversalIdentifier: BOOKING_OBJECT_UNIVERSAL_IDENTIFIER,
  type: ViewType.TABLE,
  key: ViewKey.INDEX,
  icon: 'IconCalendar',
  position: 0,
});

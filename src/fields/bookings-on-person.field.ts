import {
  defineField,
  FieldType,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';
import { BOOKING_OBJECT_UNIVERSAL_IDENTIFIER } from '../objects/booking.object';
import {
  BOOKINGS_ON_PERSON_ID,
  POINT_OF_CONTACT_ON_BOOKING_ID,
} from './point-of-contact-on-booking.field';

// ONE_TO_MANY inverse side: a Person has many Bookings. Shows up as a
// "Bookings" relation list on each person's record page.
export default defineField({
  universalIdentifier: BOOKINGS_ON_PERSON_ID,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
  type: FieldType.RELATION,
  name: 'bookings',
  label: 'Bookings',
  icon: 'IconCalendar',
  relationTargetObjectMetadataUniversalIdentifier:
    BOOKING_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    POINT_OF_CONTACT_ON_BOOKING_ID,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});

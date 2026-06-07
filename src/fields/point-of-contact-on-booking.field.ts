import {
  defineField,
  FieldType,
  RelationType,
  OnDeleteAction,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';
import { BOOKING_OBJECT_UNIVERSAL_IDENTIFIER } from '../objects/booking.object';

// MANY_TO_ONE side: each Booking points at one Person (the attendee).
// The join column `pointOfContactId` is what the webhook function writes.
export const POINT_OF_CONTACT_ON_BOOKING_ID =
  '530027d2-1517-4949-8958-abe0e6bad1b9';
export const BOOKINGS_ON_PERSON_ID =
  '9e2a3038-2c56-4d95-8549-ec9213133ba3';

export default defineField({
  universalIdentifier: POINT_OF_CONTACT_ON_BOOKING_ID,
  objectUniversalIdentifier: BOOKING_OBJECT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'pointOfContact',
  label: 'Point of Contact',
  icon: 'IconUser',
  relationTargetObjectMetadataUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
  relationTargetFieldMetadataUniversalIdentifier: BOOKINGS_ON_PERSON_ID,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'pointOfContactId',
  },
});

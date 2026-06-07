import { defineObject, FieldType } from 'twenty-sdk/define';

// Cal.com booking lifecycle. Values mirror the live `booking` object so the
// app reconciles cleanly with an existing workspace (see README "Migration").
export enum BookingStatus {
  SCHEDULED = 'SCHEDULED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
  NO_SHOW = 'NO_SHOW',
}

export const BOOKING_OBJECT_UNIVERSAL_IDENTIFIER =
  'd37a715f-3bae-474b-a2e8-05dfa7a8bbe7';

// `name` is the label-identifier field (what shows as the record title).
export const BOOKING_NAME_FIELD_UNIVERSAL_IDENTIFIER =
  '2aab45e0-5f46-4dea-9d4c-92117188a7fb';

// Exported so the unique index can reference it (see indexes/).
export const BOOKING_CAL_BOOKING_UID_FIELD_UNIVERSAL_IDENTIFIER =
  '568689cc-1e59-48cc-8475-da57b110e196';

export default defineObject({
  universalIdentifier: BOOKING_OBJECT_UNIVERSAL_IDENTIFIER,
  nameSingular: 'booking',
  namePlural: 'bookings',
  labelSingular: 'Booking',
  labelPlural: 'Bookings',
  description: 'Cal.com bookings (audit calls, etc.)',
  icon: 'IconCalendar',
  isSearchable: true,
  labelIdentifierFieldMetadataUniversalIdentifier:
    BOOKING_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  fields: [
    {
      universalIdentifier: BOOKING_NAME_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'name',
      label: 'Name',
      description: 'Booking title (from the Cal.com event)',
      icon: 'IconAbc',
    },
    {
      universalIdentifier: 'ee17de11-e2ca-46c5-8e21-ef1429ac2f63',
      type: FieldType.DATE_TIME,
      name: 'startsAt',
      label: 'Starts At',
      icon: 'IconCalendar',
      isNullable: true,
      defaultValue: null,
    },
    {
      universalIdentifier: '156d8f57-d66f-4ea4-b0f7-9300625620c4',
      type: FieldType.DATE_TIME,
      name: 'endsAt',
      label: 'Ends At',
      icon: 'IconCalendar',
      isNullable: true,
      defaultValue: null,
    },
    {
      universalIdentifier: '0dae52bb-01b5-4e27-897f-bf11e7fe07d5',
      type: FieldType.TEXT,
      name: 'meetingUrl',
      label: 'Meeting Url',
      icon: 'IconVideo',
      isNullable: true,
    },
    {
      universalIdentifier: 'bfcb1504-67e5-4cff-a82f-c7f783e295c9',
      type: FieldType.SELECT,
      name: 'status',
      label: 'Status',
      icon: 'IconProgressCheck',
      defaultValue: `'${BookingStatus.SCHEDULED}'`,
      options: [
        { value: BookingStatus.SCHEDULED, label: 'SCHEDULED', position: 0, color: 'red' },
        { value: BookingStatus.CANCELLED, label: 'CANCELLED', position: 1, color: 'orange' },
        { value: BookingStatus.COMPLETED, label: 'COMPLETED', position: 2, color: 'yellow' },
        { value: BookingStatus.NO_SHOW, label: 'NO SHOW', position: 3, color: 'green' },
      ],
    },
    {
      universalIdentifier: BOOKING_CAL_BOOKING_UID_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'calBookingUid',
      label: 'Cal Booking Uid',
      description: 'Stable Cal.com booking uid — the upsert key',
      icon: 'IconHash',
      isNullable: true,
    },
    {
      universalIdentifier: '0dd7ab2d-8e4c-453e-91be-d2491826fcc1',
      type: FieldType.BOOLEAN,
      name: 'reminder24hSent',
      label: 'Reminder24h Sent',
      icon: 'IconBell',
      defaultValue: false,
    },
    {
      universalIdentifier: '85545b69-423a-42eb-b7bb-12d5438406f3',
      type: FieldType.BOOLEAN,
      name: 'reminderDaySent',
      label: 'Reminder Day Sent',
      icon: 'IconBell',
      defaultValue: false,
    },
  ],
});

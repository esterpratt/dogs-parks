-- Enum additions live in their own transaction so later slice-7 constraints and
-- functions can safely use the new values on every supported PostgreSQL version.

alter type public.dog_action_cancellation_reason
  add value if not exists 'MEMBER_DEPARTED';
alter type public.dog_action_cancellation_reason
  add value if not exists 'ACCOUNT_ERASURE';

alter type public.notification_type
  add value if not exists 'dog_primary_transfer_offered';
alter type public.notification_type
  add value if not exists 'dog_primary_transfer_accepted';
alter type public.notification_type
  add value if not exists 'dog_primary_transfer_declined';
alter type public.notification_type
  add value if not exists 'dog_primary_transfer_canceled';
alter type public.notification_type
  add value if not exists 'dog_owner_left';
alter type public.notification_type
  add value if not exists 'dog_primary_changed';

create type public.dog_ownership_audit_event as enum (
  'PRIMARY_TRANSFER_CREATED',
  'PRIMARY_TRANSFER_CANCELED',
  'PRIMARY_TRANSFER_DECLINED',
  'PRIMARY_TRANSFER_ACCEPTED',
  'OWNER_LEFT',
  'ACCOUNT_ERASURE_PREPARED',
  'SOLO_DOG_DELETION_PREPARED'
);

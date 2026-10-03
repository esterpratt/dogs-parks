-- Enum additions are isolated so the slice-8 migration can safely use every
-- new value on PostgreSQL versions that prohibit same-transaction enum use.

alter type public.dog_action_cancellation_reason
  add value if not exists 'OWNER_SET_CHANGED';
alter type public.dog_action_cancellation_reason
  add value if not exists 'APPROVAL_WITHDRAWN';

alter type public.notification_type
  add value if not exists 'dog_deletion_consent_requested';
alter type public.notification_type
  add value if not exists 'dog_deletion_proposal_rejected';
alter type public.notification_type
  add value if not exists 'dog_deletion_proposal_canceled';
alter type public.notification_type
  add value if not exists 'dog_deletion_proposal_expired';
alter type public.notification_type
  add value if not exists 'dog_deletion_completed';

alter type public.dog_ownership_audit_event
  add value if not exists 'DOG_DELETION_PROPOSED';
alter type public.dog_ownership_audit_event
  add value if not exists 'DOG_DELETION_REJECTED';
alter type public.dog_ownership_audit_event
  add value if not exists 'DOG_DELETION_CANCELED';
alter type public.dog_ownership_audit_event
  add value if not exists 'DOG_DELETION_PREPARED';
alter type public.dog_ownership_audit_event
  add value if not exists 'DOG_DELETION_COMPLETED';

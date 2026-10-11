-- One switch controls push delivery for every dog ownership event.
alter table public.notifications_preferences
  add column dog_ownership boolean not null default true;

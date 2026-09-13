-- Adds user-selected park size categories while preserving the existing numeric size.
create type public.park_size_category as enum (
  'small',
  'medium',
  'large',
  'huge'
);

-- Stores the approved size category displayed for an existing park.
alter table public.parks
add column size_category public.park_size_category;

-- Preserves the selected category while a newly submitted park awaits approval.
alter table public.park_suggestions
add column size_category public.park_size_category;

comment on column public.parks.size_category is
  'User-selected approximate park size category.';

comment on column public.park_suggestions.size_category is
  'Approximate park size category selected when submitting the park.';
  
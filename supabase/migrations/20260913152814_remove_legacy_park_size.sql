-- Removes the obsolete numeric size after all known values were migrated.
alter table public.parks
drop column size;

-- New park suggestions now store only the user-selected category.
alter table public.park_suggestions
drop column size;
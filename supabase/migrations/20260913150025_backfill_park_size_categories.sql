-- Converts the existing approximate numeric sizes to the new categories.
update public.parks as park
set size_category = park_categories.size_category
from (
  values
    (
      '95a06a33-5cca-477f-8eae-0f1b7955e193'::uuid,
      'medium'::public.park_size_category
    ),
    (
      '8b939c11-6730-4989-8344-a3cad8645a9d'::uuid,
      'small'::public.park_size_category
    ),
    (
      '6f614a7b-4734-419d-a5a0-537f83c9ce86'::uuid,
      'small'::public.park_size_category
    ),
    (
      'cc03a7ef-5a91-4780-8274-0290462186a6'::uuid,
      'large'::public.park_size_category
    ),
    (
      '8664040a-fa63-4194-b951-91f1001e8b24'::uuid,
      'medium'::public.park_size_category
    ),
    (
      '3f52127d-24da-4237-a9c3-5093db2d3fb5'::uuid,
      'medium'::public.park_size_category
    ),
    (
      '4d6a1952-df35-4d28-b9cb-2aa9b9855f19'::uuid,
      'medium'::public.park_size_category
    ),
    (
      '438b4068-2b08-400c-bba0-18e6a9f564ff'::uuid,
      'small'::public.park_size_category
    ),
    (
      '1ea62a39-2f56-412d-9476-a4deec81f57f'::uuid,
      'medium'::public.park_size_category
    ),
    (
      'f657b665-b7b3-46b8-a3d7-50863b0260ce'::uuid,
      'small'::public.park_size_category
    ),
    (
      'c22cc79f-5a42-47c8-a5b8-c652bf0102ff'::uuid,
      'medium'::public.park_size_category
    ),
    (
      'fdc21469-6e6c-4ffc-9d9c-8d951e029d46'::uuid,
      'medium'::public.park_size_category
    ),
    (
      'a03f50f1-5630-4fbd-a8d2-858ba6dd514e'::uuid,
      'small'::public.park_size_category
    )
) as park_categories(id, size_category)
where park.id = park_categories.id
  and park.size_category is null;

-- Both existing Oxford suggestions represent exceptionally large parks.
update public.park_suggestions
set size_category = 'huge'::public.park_size_category
where id in (
  '515b7e60-2a15-483d-88bf-da899e2de419'::uuid,
  'bb8ae274-5dc2-4217-8d43-1c35e5d6d4c1'::uuid
)
and size_category is null;

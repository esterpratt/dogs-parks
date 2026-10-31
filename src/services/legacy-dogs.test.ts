import { beforeEach, expect, it, vi } from 'vitest';
import {
  createLegacyDog,
  fetchLegacyDogPage,
  fetchLegacyDogImages,
  fetchLegacyUserDogs,
  updateLegacyDog,
} from './legacy-dogs';

const { from, getSession, getUser, insert, update, list, getPublicUrl } = vi.hoisted(() => ({
  from: vi.fn(),
  getSession: vi.fn(),
  getUser: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  list: vi.fn(),
  getPublicUrl: vi.fn(),
}));

vi.mock('./supabase-client', () => ({
  supabase: {
    auth: { getSession, getUser },
    from,
    storage: { from: () => ({ list, getPublicUrl }) },
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
  const dog = { id: 'dog-id', name: 'Rex', owner: 'owner-id' };
  from.mockImplementation((table: string) => {
    if (table === 'dogs') {
      return {
        select: () => ({
          eq: () => ({
            is: () => ({ maybeSingle: async () => ({ data: dog, error: null }) }),
          }),
        }),
      };
    }
    return {
      select: () => ({
        eq: () => ({ single: async () => ({
          data: { id: 'owner-id', name: 'Owner' }, error: null,
        }) }),
      }),
    };
  });
  getSession.mockResolvedValue({
    data: { session: { user: { id: 'owner-id' } } }, error: null,
  });
  getUser.mockResolvedValue({
    data: { user: { id: 'owner-id' } }, error: null,
  });
  insert.mockReturnValue({
    select: () => ({ single: async () => ({ data: { id: 'new-dog' }, error: null }) }),
  });
  update.mockReturnValue({ eq: async () => ({ error: null }) });
  list.mockImplementation(async (path: string) => ({
    data: path.endsWith('/primary') ? [{ name: 'primary-rex.jpg' }] :
      [{ name: 'gallery.jpg' }],
    error: null,
  }));
  getPublicUrl.mockImplementation((path: string) => ({
    data: { publicUrl: `https://images.example.test/${path}` },
  }));
});

// Old rows become the page shape the current UI expects, with shared controls
// disabled and the solo owner's delete route still available.
it('maps an old solo dog into a disabled ownership page', async () => {
  const page = await fetchLegacyDogPage('dog-id');

  expect(page?.dog.name).toBe('Rex');
  expect(page?.viewer).toEqual({
    can_edit: true, is_owner: true, role: 'PRIMARY_OWNER',
  });
  expect(page?.capabilities.enabled).toBe(false);
  expect(page?.members).toHaveLength(1);
});

it('reads retained primary and gallery files from the public legacy bucket', async () => {
  const images = await fetchLegacyDogImages('dog-id');

  expect(images).toHaveLength(2);
  expect(images[0]).toMatchObject({
    canDelete: true,
    isPrimary: true,
    storagePath: 'owner-id/dogs/dog-id/primary/primary-rex.jpg',
  });
  expect(images[1].isPrimary).toBe(false);
});

it('loads a profile dog list through the old dogs table', async () => {
  const dogs = [{ id: 'dog-id', name: 'Rex', owner: 'owner-id' }];
  from.mockReturnValue({
    select: () => ({
      eq: () => ({ is: async () => ({ data: dogs, error: null }) }),
    }),
  });

  await expect(fetchLegacyUserDogs('owner-id')).resolves.toEqual(dogs);
  expect(from).toHaveBeenCalledWith('dogs');
});

it('writes only old-schema dog fields under the current owner', async () => {
  from.mockImplementation((table: string) => {
    if (table === 'dogs') {
      return {
        insert,
        update,
        select: () => ({
          eq: () => ({
            is: () => ({ maybeSingle: async () => ({
              data: { id: 'dog-id', owner: 'owner-id' }, error: null,
            }) }),
          }),
        }),
      };
    }
    return {};
  });

  await expect(createLegacyDog({
    name: 'Rex', owner: 'owner-id', primary_image_id: 'new-schema-only',
  })).resolves.toBe('new-dog');
  expect(insert).toHaveBeenCalledWith(expect.objectContaining({
    name: 'Rex', owner: 'owner-id',
  }));
  expect(insert.mock.calls[0][0]).not.toHaveProperty('primary_image_id');

  await updateLegacyDog('dog-id', {
    name: 'Rex II', owner: 'other-user', primary_image_id: 'new-schema-only',
  });
  expect(update).toHaveBeenCalledWith(expect.objectContaining({ name: 'Rex II' }));
  expect(update.mock.calls[0][0]).not.toHaveProperty('owner');
  expect(update.mock.calls[0][0]).not.toHaveProperty('primary_image_id');
});

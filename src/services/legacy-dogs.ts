import type { Dog } from '../types/dog';
import type { DogImage } from '../types/dog-image';
import type { DogPageData, UserDogAssociation } from '../types/dog-ownership';
import { supabase } from './supabase-client';
import { getFileUrl } from './supabase-storage';
import { uploadImage } from './image';

const getLegacyDog = async (dogId: string) => {
  const { data, error } = await supabase.from('dogs').select('*')
    .eq('id', dogId).is('deleted_at', null).maybeSingle();
  if (error) {
    throw error;
  }
  return data;
};

const getLegacyOwnerDog = async (dogId: string) => {
  const dog = await getLegacyDog(dogId);
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    throw error;
  }
  if (!dog || dog.owner !== data.user?.id) {
    throw new Error('Dog changes are limited to its owner');
  }
  return dog;
};

const legacyDogContent = (dogDetails: Partial<Dog>) => ({
  name: dogDetails.name,
  birthday: dogDetails.birthday,
  gender: dogDetails.gender,
  size: dogDetails.size,
  breed: dogDetails.breed,
  temperament: dogDetails.temperament,
  likes: dogDetails.likes,
  dislikes: dogDetails.dislikes,
  description: dogDetails.description,
  possessive: dogDetails.possessive,
  energy: dogDetails.energy,
});

const fetchLegacyUserDogs = async (userId: string): Promise<Dog[]> => {
  const { data, error } = await supabase.from('dogs').select('*')
    .eq('owner', userId).is('deleted_at', null);
  if (error) {
    throw error;
  }
  return data;
};

const fetchLegacyUsersDogs = async (
  userIds: string[],
): Promise<UserDogAssociation[]> => {
  if (!userIds.length) {
    return [];
  }
  const { data, error } = await supabase.from('dogs').select('*')
    .in('owner', userIds).is('deleted_at', null);
  if (error) {
    throw error;
  }
  return data.map((dog) => ({ dog, profile_user_id: dog.owner! }));
};

const fetchLegacyDogPage = async (dogId: string): Promise<DogPageData | null> => {
  const dog = await getLegacyDog(dogId);
  if (!dog?.owner) {
    return null;
  }
  const [{ data: profile, error: profileError }, { data: auth, error: authError }] =
    await Promise.all([
      supabase.from('users').select('id,name').eq('id', dog.owner).single(),
      supabase.auth.getSession(),
    ]);
  if (profileError) {
    throw profileError;
  }
  if (authError) {
    throw authError;
  }
  const isOwner = auth.session?.user.id === dog.owner;
  // A legacy dog has one authoritative owner. Disabled capabilities keep the
  // shared-owner controls hidden while preserving the solo deletion route.
  return {
    outcome: 'OK',
    dog,
    profile_user: profile,
    viewer: {
      can_edit: isOwner,
      is_owner: isOwner,
      role: isOwner ? 'PRIMARY_OWNER' : null,
    },
    capabilities: {
      active_owner_count: 1,
      enabled: false,
      is_owner: isOwner,
      outcome: 'OK',
      role: isOwner ? 'PRIMARY_OWNER' : null,
    },
    members: [{
      id: dog.owner,
      joined_at: '',
      role: 'PRIMARY_OWNER',
      user_id: dog.owner,
      user_name: profile.name,
    }],
  };
};

const createLegacyDog = async (dogDetails: Omit<Dog, 'id'>) => {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user || authData.user.id !== dogDetails.owner) {
    throw authError ?? new Error('Dog creation requires its owner session');
  }
  // Send only fields understood by the old schema. New ownership authority
  // fields must never be written through the legacy table API.
  const { data, error } = await supabase.from('dogs').insert({
    ...legacyDogContent(dogDetails),
    owner: authData.user.id,
  })
    .select('id').single();
  if (error) {
    throw error;
  }
  return data.id;
};

const updateLegacyDog = async (dogId: string, dogDetails: Partial<Dog>) => {
  await getLegacyOwnerDog(dogId);
  const { error } = await supabase.from('dogs')
    .update(legacyDogContent(dogDetails)).eq('id', dogId);
  if (error) {
    throw error;
  }
};

const getLegacyImagePaths = async (dogId: string) => {
  const dog = await getLegacyDog(dogId);
  if (!dog?.owner) {
    return { dog, primary: [] as string[], other: [] as string[] };
  }
  const root = `${dog.owner}/dogs/${dogId}`;
  const [primaryResult, otherResult] = await Promise.all([
    supabase.storage.from('users').list(`${root}/primary`),
    supabase.storage.from('users').list(`${root}/other`),
  ]);
  if (primaryResult.error) {
    throw primaryResult.error;
  }
  if (otherResult.error) {
    throw otherResult.error;
  }
  return {
    dog,
    primary: primaryResult.data.map((image) => `${root}/primary/${image.name}`),
    other: otherResult.data.map((image) => `${root}/other/${image.name}`),
  };
};

const fetchLegacyDogImages = async (dogId: string): Promise<DogImage[]> => {
  const { dog, primary, other } = await getLegacyImagePaths(dogId);
  if (!dog) {
    return [];
  }
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    throw error;
  }
  const canDelete = data.session?.user.id === dog.owner;
  return [...primary, ...other].map((storagePath) => ({
    canDelete,
    id: storagePath,
    isPrimary: primary.includes(storagePath),
    storagePath,
    url: getFileUrl({ bucketName: 'users', fileName: storagePath }),
  }));
};

const uploadLegacyDogImage = async (image: File | string, dogId: string) => {
  const dog = await getLegacyOwnerDog(dogId);
  const { primary } = await getLegacyImagePaths(dogId);
  return uploadImage({
    image,
    bucket: 'users',
    path: `${dog.owner}/dogs/${dogId}/${primary.length ? 'other' : 'primary'}`,
    ...(!primary.length ? { name: 'primary' } : {}),
  });
};

const assertLegacyImageOwner = async (storagePath: string) => {
  const parts = storagePath.split('/');
  if (parts.length !== 5 || parts[1] !== 'dogs' ||
      !['primary', 'other'].includes(parts[3]) || !parts[4]) {
    throw new Error('Invalid legacy dog photo path');
  }
  const dog = await getLegacyOwnerDog(parts[2]);
  if (dog.owner !== parts[0]) {
    throw new Error('Invalid legacy dog photo owner');
  }
  return { dog, parts };
};

const deleteLegacyDogImage = async (storagePath: string) => {
  await assertLegacyImageOwner(storagePath);
  const { error } = await supabase.storage.from('users').remove([storagePath]);
  if (error) {
    throw error;
  }
};

const setLegacyDogPrimaryImage = async (storagePath: string) => {
  const { dog, parts } = await assertLegacyImageOwner(storagePath);
  if (parts[3] !== 'other') {
    return;
  }
  const { primary } = await getLegacyImagePaths(dog.id);
  const previousPrimary = primary[0];
  const previousOther = previousPrimary
    ? `${dog.owner}/dogs/${dog.id}/other/${previousPrimary.split('/').pop()?.replace(/^primary-/, '')}`
    : null;
  const nextPrimary = `${dog.owner}/dogs/${dog.id}/primary/primary-${parts[4]}`;
  if (previousPrimary && previousOther) {
    const { error } = await supabase.storage.from('users')
      .move(previousPrimary, previousOther);
    if (error) {
      throw error;
    }
  }
  const { error } = await supabase.storage.from('users')
    .move(storagePath, nextPrimary);
  if (error) {
    if (previousPrimary && previousOther) {
      await supabase.storage.from('users').move(previousOther, previousPrimary);
    }
    throw error;
  }
};

export {
  createLegacyDog,
  updateLegacyDog,
  fetchLegacyUserDogs,
  fetchLegacyUsersDogs,
  fetchLegacyDogPage,
  fetchLegacyDogImages,
  uploadLegacyDogImage,
  deleteLegacyDogImage,
  setLegacyDogPrimaryImage,
};

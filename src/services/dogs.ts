import { throwError } from './error';
import { Dog } from '../types/dog';
import { supabase } from './supabase-client';
import { deleteImage, fetchImagesByDirectory, removeBasePath, uploadImage } from './image';

type CreateDogProps = Omit<Dog, 'id'>;

interface EditDogProps {
  dogId: string;
  dogDetails: Partial<Dog>;
}

const dogOwnerCache = new Map<string, string>();

const getDogOwnerId = async (dogId: string) => {
  if (dogOwnerCache.has(dogId)) {
    return dogOwnerCache.get(dogId);
  }

  const { data: dog, error } = await supabase
  .from('dogs')
  .select('owner')
  .eq('id', dogId)
  .single();

  if (error) {
    throw error;
  }

  const ownerId = dog.owner;
  dogOwnerCache.set(dogId, ownerId);
  return ownerId;
};

const createDog = async (createDogProps: CreateDogProps) => {
  try {
    const { data: dog, error } = await supabase
    .from('dogs')
    .insert([
      { ...createDogProps },
    ])
    .select('id')
    .single();

    if (error) {
      throw error;
    }

    return dog.id
  } catch (error) {
    throwError(error);
  }
};

const updateDog = async ({ dogId, dogDetails }: EditDogProps) => {
  try {
    const { error } = await supabase
    .from('dogs')
    .update({ ...dogDetails })
    .eq('id', dogId)

    if (error) {
      throw error;
    }
  } catch (error) {
    throwError(error);
  }
};

const deleteDog = async (id: string) => {
  try {
    const { error } = await supabase.rpc('delete_dog', { dog_id: id });

    if (error) {
        throw error;
    }
  } catch (error) {
    console.error(`there was an error deleting dog with id ${id}: ${JSON.stringify(error)}`);
    return null;
  }
};

const fetchDogs = async (ids?: string[]) => {
  try {
    if (!ids || !ids.length) {
      const { data: dogs, error } = await supabase
      .from('dogs')
      .select('*')
      .is('deleted_at', null)

      if (error) {
        throw error;
      }

      return dogs;
    } else {
      const { data: dogs, error } = await supabase
      .from('dogs')
      .select('*')
      .in('id', ids)
      .is('deleted_at', null)

      if (error) {
        throw error;
      }
      return dogs;
    }
  } catch (error) {
    throwError(error);
  }
};

const fetchUserDogs = async (userId: string) => {
  try {
    const { data: dogs, error } = await supabase
    .from('dogs')
    .select('*')
    .eq('owner', userId)
    .is('deleted_at', null)

    if (error) {
      throw error;
    }

    return dogs;
  } catch (error) {
    throwError(error);
  }
};

const fetchUsersDogs = async (userIds: string[]) => {
  try {
    const { data: dogs, error } = await supabase
    .from('dogs')
    .select('*')
    .in('owner', userIds)
    .is('deleted_at', null)

    if (error) {
      throw error;
    }

    return dogs;
  } catch (error) {
    throwError(error);
  }
};

const uploadDogImage = async (image: File | string, dogId: string) => {
  try {
    const userId = await getDogOwnerId(dogId);
    const res = await uploadImage({
      image,
      path: `${userId}/dogs/${dogId}/other/`,
      bucket: 'users',
    });
    return res;
  } catch (error) {
    throwError(error);
  }
};

const uploadDogPrimaryImage = async ({image, dogId, upsert}: {image: File | string, dogId: string, upsert: boolean}) => {
  try {
    const userId = await getDogOwnerId(dogId);
    const res = await uploadImage({
      image,
      bucket: 'users',
      path: `${userId}/dogs/${dogId}/primary/`,
      name: 'primary',
      upsert
    });
    return res;
  } catch (error) {
    throwError(error);
  }
};

const fetchDogPrimaryImage = async (dogId: string) => {
  try {
    const userId = await getDogOwnerId(dogId);

    const res = await fetchImagesByDirectory({bucket: 'users', path: `${userId}/dogs/${dogId}/primary/`});
    return res?.[0];
  } catch (error) {
    console.error(
      `there was a problem fetching primary image for dog ${dogId}: ${JSON.stringify(error)}`
    );
    return null;
  }
};

const fetchAllDogImages = async (dogId: string) => {
  try {
    const userId = await getDogOwnerId(dogId);

    const res = await fetchImagesByDirectory({bucket: 'users', path: `${userId}/dogs/${dogId}/other/`});
    return res;
  } catch (error) {
    console.error(
      `there was a problem fetching images for dog ${dogId}: ${JSON.stringify(error)}`
    );
    return null;
  }
};

const deleteDogImage = async (imgPath: string) => {
  const relevantPath = removeBasePath(imgPath, 'users/');
  return deleteImage({bucket: 'users', path: relevantPath});
}

export {
  fetchDogs,
  createDog,
  updateDog,
  deleteDog,
  fetchUserDogs,
  fetchUsersDogs,
  fetchDogPrimaryImage,
  fetchAllDogImages,
  uploadDogImage,
  uploadDogPrimaryImage,
  deleteDogImage
};

export type { EditDogProps };

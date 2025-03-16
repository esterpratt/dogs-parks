import { throwError } from './error';
import { Dog } from '../types/dog';
import { supabase } from './supabase-client';

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
    // TODO: delete dogs images

    // const userId = await getDogOwnerId(id);
    // const deleteFoldersPromises = [
    //   deleteFolder(`users/${userId}/dogs/${id}/primary/`),
    //   deleteFolder(`users/${userId}/dogs/${id}/other/`),
    // ];
    // await Promise.all(deleteFoldersPromises);

    const { error } = await supabase
    .from('dogs')
    .delete()
    .eq('id', id)

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

      if (error) {
        throw error;
      }

      return dogs;
    } else {
      const { data: dogs, error } = await supabase
      .from('dogs')
      .select('*')
      .in('id', ids)

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
    // TODO: upload image

    // const res = await uploadImage({
    //   image,
    //   path: `users/${userId}/dogs/${dogId}/other`,
    // });
    // return res;
  } catch (error) {
    throwError(error);
  }
};

const uploadDogPrimaryImage = async (image: File | string, dogId: string) => {
  try {
    const userId = await getDogOwnerId(dogId);
    // TODO: upload primary image

    // const res = await uploadImage({
    //   image,
    //   path: `users/${userId}/dogs/${dogId}/primary`,
    //   name: 'primaryImage',
    // });
    // return res;
  } catch (error) {
    throwError(error);
  }
};

const fetchDogPrimaryImage = async (dogId: string) => {
  try {
    const userId = await getDogOwnerId(dogId);
    // TODO: fetch primary image

    // const res = await fetchImagesByDirectory(
    //   `users/${userId}/dogs/${dogId}/primary`
    // );
    // return res;
    return []
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
    // TODO: fetch images

    // const res = await fetchImagesByDirectory(
    //   `users/${userId}/dogs/${dogId}/other`
    // );
    // return res;
    return []
  } catch (error) {
    throwError(error);
  }
};

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
};

export type { EditDogProps };

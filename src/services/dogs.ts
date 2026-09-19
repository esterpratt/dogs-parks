import { throwError } from './error';
import { Dog } from '../types/dog';
import { supabase } from './supabase-client';
import {
  deleteImage,
  fetchImagesByDirectory,
  moveImage,
  uploadImage,
} from './image';
import { removeBasePath } from './image-utils';

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
      .insert([{ ...createDogProps }])
      .select('id')
      .single();

    if (error) {
      throw error;
    }

    return dog.id;
  } catch (error) {
    throwError(error);
  }
};

const updateDog = async ({ dogId, dogDetails }: EditDogProps) => {
  try {
    const { error } = await supabase
      .from('dogs')
      .update({ ...dogDetails })
      .eq('id', dogId);

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
    // Prevent the deletion modal from treating a failed RPC as success.
    throwError(error);
  }
};

const fetchDogs = async (ids: string[]) => {
  try {
    const { data: dogs, error } = await supabase
      .from('dogs')
      .select('*')
      .in('id', ids)
      .is('deleted_at', null);

    if (error) {
      throw error;
    }

    return dogs;
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
      .is('deleted_at', null);

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
      .is('deleted_at', null);

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
    const response = await uploadImage({
      image,
      path: `${userId}/dogs/${dogId}/other/`,
      bucket: 'users',
    });

    return response;
  } catch (error) {
    throwError(error);
  }
};

const uploadDogPrimaryImage = async ({
  image,
  dogId,
  upsert,
}: {
  image: File | string;
  dogId: string;
  upsert: boolean;
}) => {
  try {
    const userId = await getDogOwnerId(dogId);
    const response = await uploadImage({
      image,
      bucket: 'users',
      path: `${userId}/dogs/${dogId}/primary`,
      name: 'primary',
      upsert,
    });

    return response;
  } catch (error) {
    throwError(error);
  }
};

const fetchDogPrimaryImage = async (dogId: string) => {
  try {
    const userId = await getDogOwnerId(dogId);

    const response = await fetchImagesByDirectory({
      bucket: 'users',
      path: `${userId}/dogs/${dogId}/primary/`,
    });

    return response?.[0] ?? null;
  } catch (error) {
    console.error(
      `there was a problem fetching primary image for dog ${dogId}: ${error}`
    );
    return null;
  }
};

const fetchAllDogImages = async (dogId: string) => {
  try {
    const userId = await getDogOwnerId(dogId);

    const response = await fetchImagesByDirectory({
      bucket: 'users',
      path: `${userId}/dogs/${dogId}/other/`,
    });

    return response;
  } catch (error) {
    console.error(
      `there was a problem fetching images for dog ${dogId}: ${error}`
    );
    return null;
  }
};

const movePrimaryImageToOther = async (imagePath: string, dogId: string) => {
  try {
    const userId = await getDogOwnerId(dogId);
    const imageName = imagePath
      .split('primary/')[1]
      .slice('primary-'.length);

    if (imageName) {
      const newPath = `${userId}/dogs/${dogId}/other/${imageName}`;
      const oldPath = `${userId}/dogs/${dogId}/primary/primary-${imageName}`;

      return moveImage({
        bucket: 'users',
        oldPath,
        newPath,
      });
    }

    return null;
  } catch (error) {
    console.error(
      `there was a problem moving primary image for dog ${dogId}: ${error}`
    );
    return null;
  }
};

const moveOtherImageToPrimary = async (
  imagePath: string,
  dogId: string
) => {
  try {
    const userId = await getDogOwnerId(dogId);
    const imageName = imagePath.split('other/')[1];
    const newPath = `${userId}/dogs/${dogId}/primary/primary-${imageName}`;
    const oldPath = `${userId}/dogs/${dogId}/other/${imageName}`;

    return moveImage({
      bucket: 'users',
      oldPath,
      newPath,
    });
  } catch (error) {
    console.error(
      `there was a problem moving other image for dog ${dogId}: ${error}`
    );
    return null;
  }
};

const setDogPrimaryImage = async (imagePath: string, dogId: string) => {
  try {
    const currentPrimaryImage = await fetchDogPrimaryImage(dogId);
    const promises = [moveOtherImageToPrimary(imagePath, dogId)];

    if (currentPrimaryImage) {
      promises.push(
        movePrimaryImageToOther(currentPrimaryImage, dogId)
      );
    }

    const [newPrimaryResponse, oldPrimaryResponse] =
      await Promise.all(promises);

    if (!newPrimaryResponse || !oldPrimaryResponse) {
      throw new Error('Error moving images');
    }
  } catch (error) {
    console.error(
      `there was a problem moving images for dog ${dogId}: ${error}`
    );
  }
};

const deleteDogImage = async (imagePath: string) => {
  const relevantPath = removeBasePath(imagePath, 'users/');
  return deleteImage({ bucket: 'users', path: relevantPath });
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
  deleteDogImage,
  setDogPrimaryImage,
};

export type { EditDogProps };

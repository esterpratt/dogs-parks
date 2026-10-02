import { throwError } from './error';
import { Dog } from '../types/dog';
import { DogImage } from '../types/dog-image';
import { supabase } from './supabase-client';
import { prepareImage } from './image';

type CreateDogProps = Omit<Dog, 'id'>;

interface EditDogProps {
  dogId: string;
  dogDetails: Partial<Dog>;
}

const DOG_IMAGE_URL_LIFETIME_SECONDS = 15 * 60;
const DOG_IMAGE_URL_REFRESH_BUFFER_MS = 2 * 60 * 1000;
const DOG_IMAGE_QUERY_REFRESH_MS =
  DOG_IMAGE_URL_LIFETIME_SECONDS * 1000 - DOG_IMAGE_URL_REFRESH_BUFFER_MS;
const dogImageUrlCache = new Map<
  string,
  { expiresAt: number; storagePath: string; url: string }
>();

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
    const preparedImage = await prepareImage(image);
    const { data: reservations, error: reservationError } = await supabase.rpc(
      'api_reserve_dog_image',
      {
        p_dog_id: dogId,
        p_extension: preparedImage.format,
      }
    );

    if (reservationError) {
      throw reservationError;
    }

    const reservation = reservations?.[0];
    if (!reservation) {
      throw new Error('Dog image reservation was not created');
    }

    // Storage accepts only this unexpired reservation path for its creating owner.
    const { error: uploadError } = await supabase.storage
      .from('dogs')
      .upload(reservation.storage_path, preparedImage.file, {
        cacheControl: '2592000',
        contentType: `image/${preparedImage.format}`,
      });

    if (uploadError) {
      throw uploadError;
    }

    const { error: finalizeError } = await supabase.rpc(
      'api_finalize_dog_image',
      {
        p_image_id: reservation.id,
      }
    );

    if (finalizeError) {
      throw finalizeError;
    }

    return reservation.id;
  } catch (error) {
    throwError(error);
  }
};

const getDogImageUrl = async ({
  bucketId,
  imageId,
  storagePath,
}: {
  bucketId: string;
  imageId: string;
  storagePath: string;
}) => {
  const cached = dogImageUrlCache.get(imageId);
  const now = Date.now();

  if (
    cached &&
    cached.storagePath === storagePath &&
    cached.expiresAt - DOG_IMAGE_URL_REFRESH_BUFFER_MS > now
  ) {
    return cached.url;
  }

  const { data, error } = await supabase.storage
    .from(bucketId)
    .createSignedUrl(storagePath, DOG_IMAGE_URL_LIFETIME_SECONDS);

  if (error) {
    throw error;
  }

  dogImageUrlCache.set(imageId, {
    expiresAt: now + DOG_IMAGE_URL_LIFETIME_SECONDS * 1000,
    storagePath,
    url: data.signedUrl,
  });

  return data.signedUrl;
};

const fetchDogImageRecords = async (dogId: string): Promise<DogImage[]> => {
  const [{ data: dog, error: dogError }, { data: authData, error: authError }] =
    await Promise.all([
      supabase
        .from('dogs')
        .select('primary_image_id')
        .eq('id', dogId)
        .single(),
      supabase.auth.getUser(),
    ]);

  if (dogError) {
    throw dogError;
  }

  if (authError) {
    throw authError;
  }

  const { data: membership, error: membershipError } = await supabase
    .from('dog_members')
    .select('id,role')
    .eq('dog_id', dogId)
    .eq('user_id', authData.user.id)
    .is('left_at', null)
    .maybeSingle();

  if (membershipError) {
    throw membershipError;
  }

  const { data: images, error: imagesError } = await supabase
    .from('dog_images')
    .select('id,bucket_id,storage_path,uploader_member_id,created_at')
    .eq('dog_id', dogId)
    .eq('upload_state', 'ACTIVE')
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (imagesError) {
    throw imagesError;
  }

  return Promise.all(
    images.map(async (dogImage) => ({
      canDelete:
        membership?.role === 'PRIMARY_OWNER' ||
        membership?.id === dogImage.uploader_member_id,
      id: dogImage.id,
      isPrimary: dog.primary_image_id === dogImage.id,
      storagePath: dogImage.storage_path,
      url: await getDogImageUrl({
        bucketId: dogImage.bucket_id,
        imageId: dogImage.id,
        storagePath: dogImage.storage_path,
      }),
    }))
  );
};

const fetchDogPrimaryImage = async (dogId: string) => {
  try {
    const images = await fetchDogImageRecords(dogId);
    return images.find(({ isPrimary }) => isPrimary)?.url ?? null;
  } catch (error) {
    console.error(
      `there was a problem fetching primary image for dog ${dogId}: ${error}`
    );
    return null;
  }
};

const fetchAllDogImages = async (dogId: string) => {
  try {
    return await fetchDogImageRecords(dogId);
  } catch (error) {
    console.error(
      `there was a problem fetching images for dog ${dogId}: ${error}`
    );
    return null;
  }
};

const setDogPrimaryImage = async (imageId: string) => {
  try {
    const { error } = await supabase.rpc('api_set_primary_dog_image', {
      p_image_id: imageId,
    });

    if (error) {
      throw error;
    }
  } catch (error) {
    throwError(error);
  }
};

const deleteDogImage = async (imageId: string) => {
  try {
    const { error } = await supabase.rpc('api_delete_dog_image', {
      p_image_id: imageId,
    });

    if (error) {
      throw error;
    }

    dogImageUrlCache.delete(imageId);
  } catch (error) {
    throwError(error);
  }
};

const clearDogImageUrlCache = () => {
  dogImageUrlCache.clear();
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
  deleteDogImage,
  setDogPrimaryImage,
  clearDogImageUrlCache,
  DOG_IMAGE_QUERY_REFRESH_MS,
};

export type { EditDogProps };

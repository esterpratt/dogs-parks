import { throwError } from './error';
import { Dog } from '../types/dog';
import { DogImage, DogMemberRole, UserDogRow } from '../types/dogOwnership';
import { supabase } from './supabase-client';
import { deleteImage, uploadImageWithPath } from './image';
import { getFileUrl } from './supabase-storage';

type CreateDogProps = Omit<Dog, 'id'>;

interface EditDogProps {
  dogId: string;
  dogDetails: Partial<Dog>;
}

const buildDogImageUrl = (image: DogImage) => {
  return getFileUrl({
    bucketName: image.bucket_id,
    fileName: image.storage_path,
  });
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

    const { error: memberError } = await supabase.from('dog_members').insert([
      {
        dog_id: dog.id,
        user_id: createDogProps.owner,
        role: DogMemberRole.PRIMARY_OWNER,
      },
    ]);

    if (memberError) {
      await supabase.from('dogs').delete().eq('id', dog.id);
      throw memberError;
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
    console.error(`there was an error deleting dog with id ${id}: ${error}`);
    return null;
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

const fetchUserDogsByRoles = async (userId: string, roles: DogMemberRole[]) => {
  try {
    const { data, error } = await supabase
      .from('dog_members')
      .select('dog:dogs(*)')
      .eq('user_id', userId)
      .in('role', roles);

    if (error) {
      throw error;
    }

    const rows = data as unknown as { dog: Dog | null }[];
    return rows.map((row) => row.dog).filter((dog) => !!dog);
  } catch (error) {
    throwError(error);
  }
};

const fetchUsersDogsByRoles = async (
  userIds: string[],
  roles: DogMemberRole[],
) => {
  try {
    if (!userIds.length) {
      return [];
    }

    const { data, error } = await supabase
      .from('dog_members')
      .select('user_id, role, dog:dogs(*)')
      .in('user_id', userIds)
      .in('role', roles);

    if (error) {
      throw error;
    }

    const rows = data as unknown as UserDogRow[];
    return rows.filter((row) => !!row.dog);
  } catch (error) {
    throwError(error);
  }
};

const fetchUserDogs = async (userId: string) => {
  return fetchUserDogsByRoles(userId, [
    DogMemberRole.PRIMARY_OWNER,
    DogMemberRole.EDITOR,
    DogMemberRole.VIEWER,
  ]);
};

const fetchUsersDogs = async (userIds: string[]) => {
  return fetchUsersDogsByRoles(userIds, [
    DogMemberRole.PRIMARY_OWNER,
    DogMemberRole.EDITOR,
    DogMemberRole.VIEWER,
  ]);
};

const uploadDogImage = async (image: File | string, dogId: string) => {
  try {
    const uploadResult = await uploadImageWithPath({
      image,
      path: dogId,
      bucket: 'dogs',
    });

    if (!uploadResult?.path) {
      throw new Error('missing_upload_path');
    }

    const { error } = await supabase.from('dog_images').insert([
      {
        dog_id: dogId,
        bucket_id: 'dogs',
        storage_path: uploadResult.path,
        is_primary: false,
      },
    ]);

    if (error) {
      throw error;
    }

    return uploadResult.publicUrl;
  } catch (error) {
    throwError(error);
  }
};

const uploadDogPrimaryImage = async ({
  image,
  dogId,
}: {
  image: File | string;
  dogId: string;
}) => {
  try {
    const { data: currentPrimary, error: currentPrimaryError } =
      await supabase
        .from('dog_images')
        .select('id, dog_id, bucket_id, storage_path, is_primary, created_at')
        .eq('dog_id', dogId)
        .eq('is_primary', true)
        .maybeSingle();

    if (currentPrimaryError) {
      throw currentPrimaryError;
    }

    const uploadResult = await uploadImageWithPath({
      image,
      bucket: 'dogs',
      path: dogId,
    });

    if (!uploadResult?.path) {
      throw new Error('missing_upload_path');
    }

    const { error } = await supabase.from('dog_images').insert([
      {
        dog_id: dogId,
        bucket_id: 'dogs',
        storage_path: uploadResult.path,
        is_primary: true,
      },
    ]);

    if (error) {
      throw error;
    }

    if (currentPrimary) {
      const { error: deleteError } = await supabase
        .from('dog_images')
        .delete()
        .eq('id', currentPrimary.id);

      if (deleteError) {
        throw deleteError;
      }

      await deleteImage({
        bucket: currentPrimary.bucket_id,
        path: currentPrimary.storage_path,
      });
    }

    return uploadResult.publicUrl;
  } catch (error) {
    throwError(error);
  }
};

const fetchDogPrimaryImage = async (dogId: string) => {
  try {
    const { data, error } = await supabase
      .from('dog_images')
      .select('id, dog_id, bucket_id, storage_path, is_primary, created_at')
      .eq('dog_id', dogId)
      .eq('is_primary', true)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return null;
    }

    return buildDogImageUrl(data as DogImage);
  } catch (error) {
    console.error(
      `there was a problem fetching primary image for dog ${dogId}: ${error}`,
    );
    return null;
  }
};

const fetchAllDogImages = async (dogId: string) => {
  try {
    const { data, error } = await supabase
      .from('dog_images')
      .select('id, dog_id, bucket_id, storage_path, is_primary, created_at')
      .eq('dog_id', dogId)
      .eq('is_primary', false)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return (data ?? []).map((image) => ({
      ...(image as DogImage),
      url: buildDogImageUrl(image as DogImage),
    }));
  } catch (error) {
    console.error(
      `there was a problem fetching images for dog ${dogId}: ${error}`,
    );
    return null;
  }
};

const setDogPrimaryImage = async (dogImageId: string, dogId: string) => {
  try {
    const { error: resetError } = await supabase
      .from('dog_images')
      .update({ is_primary: false })
      .eq('dog_id', dogId)
      .eq('is_primary', true);

    if (resetError) {
      throw resetError;
    }

    const { error } = await supabase
      .from('dog_images')
      .update({ is_primary: true })
      .eq('id', dogImageId);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error(
      `there was a problem updating primary image for dog ${dogId}: ${error}`,
    );
  }
};

const deleteDogImage = async (image: DogImage) => {
  try {
    const { error } = await supabase
      .from('dog_images')
      .delete()
      .eq('id', image.id);

    if (error) {
      throw error;
    }

    await deleteImage({ bucket: image.bucket_id, path: image.storage_path });
  } catch (error) {
    console.error('Sorry, there was a problem deleting the image: ', error);
  }
};

export {
  fetchDogs,
  createDog,
  updateDog,
  deleteDog,
  fetchUserDogsByRoles,
  fetchUsersDogsByRoles,
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

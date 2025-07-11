import { v4 } from 'uuid';
import { supabase } from './supabase-client';
import { throwError } from './error';
import { getFileUrl } from './supabase-storage';
import { cleanName } from './image-utils';

interface UploadImageProps {
  image: File | string;
  path: string;
  name?: string;
  bucket: string;
  upsert?: boolean;
}

interface HandleImageProps {
  bucket: string;
  path: string
}

interface MoveImageProps {
  bucket: string;
  oldPath: string;
  newPath: string;
}

const fetchImagesByDirectory = async ({path, bucket}: HandleImageProps) => {
  try {
    const { data, error } = await supabase
    .storage
    .from(bucket)
    .list(path)

    if (error) {
      throw error
    }

    const imagesUrl = data.map(image => {
      return getFileUrl({bucketName: bucket, fileName: `${path}${image.name}`})
    })

    return imagesUrl;
  } catch (error) {
    throwError(error);
  }
};

const deleteImage = async ({path, bucket}: HandleImageProps) => {
  try {
    const { error } = await supabase
    .storage
    .from(bucket)
    .remove([path])

    if (error) {
      throw error
    }
  } catch (error) {
    console.error('Sorry, there was a problem deleting the image: ', JSON.stringify(error));
  }
};

const uploadImage = async ({ image, bucket, path, name, upsert }: UploadImageProps) => {
  try {
    const rawInput = name || (typeof image !== 'string' ? image.name : 'image');
    const baseWithoutExt = rawInput.replace(/\.[^/.]+$/, '');
    const rawBase = cleanName(baseWithoutExt);
    const rawName = `${rawBase}-${v4()}`;

    const { compressImage, getCompressedImage } = await import('./image-compression');

    const file =
      typeof image === 'string'
        ? await getCompressedImage(image, rawName)
        : image;
        
    const { file: compressedImage, format } = await compressImage(file);

    const fileName = `${rawName}.${format}`;
    const fullPath = `${path}/${fileName}`;

    let oldImages: string[] = [];
    if (upsert) {
      const { data: oldData, error: oldError } = await supabase.storage.from(bucket).list(path);
      if (oldError) throw oldError;
      oldImages = oldData ? oldData.map(img => img.name) : [];
    }

    const { data, error } = await supabase
      .storage
      .from(bucket)
      .upload(fullPath, compressedImage, {
        contentType: `image/${format}`,
        cacheControl: '2592000'
      })

    if (error) {
      throw error;
    }

    if (upsert && oldImages.length) {
      for (const oldImageName of oldImages) {
        if (oldImageName !== fileName) {
          await deleteImage({ bucket, path: `${path}/${oldImageName}` });
        }
      }
    }

    return getFileUrl({bucketName: bucket, fileName: data?.path || ''});
  } catch (error) {
    throwError(error);
  }
};

const moveImage = async ({ bucket, oldPath, newPath }: MoveImageProps) => {
  try {
    const { data, error } = await supabase
    .storage
    .from(bucket)
    .move(oldPath, newPath)

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Sorry, there was a problem moving the image: ', JSON.stringify(error));
    return null;
  }
};

export { uploadImage, fetchImagesByDirectory, deleteImage, moveImage };

import imageCompression from 'browser-image-compression';
import { v4 } from 'uuid';
import { supabase } from './supabase-client';
import { throwError } from './error';
import { getFileUrl } from './supabase-storage';

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

const cleanName = (str: string) => {
  return str.replace(/[\u0590-\u05FF]+|\s+/g, '-');
}

const removeBasePath = (url: string, marker: string) => {
  const index = url.lastIndexOf(marker);
  return index !== -1 ? url.slice(index + marker.length) : url;
}

const deleteOldImage = async ({ bucket, path }: HandleImageProps) => {
  try {
    const imagePath = await fetchImagesByDirectory({ bucket, path });
    if (!imagePath || !imagePath.length) {
      return;
    }

    const imagePathWithName = removeBasePath(imagePath[0], 'users/');
    await deleteImage({ bucket, path: imagePathWithName });
  } catch (error) {
    throwError(error);
  }
};

const uploadImage = async ({ image, bucket, path, name, upsert }: UploadImageProps) => {
  try {
    const prefix = typeof image === 'string' ? '' : image.name;
    const imageName = name ? name + v4() : prefix + v4();
    const cleanedImageName = cleanName(imageName);
    const file =
      typeof image === 'string'
        ? await imageCompression.getFilefromDataUrl(image, cleanedImageName)
        : image;

    const compressedImage = await imageCompression(file, {
      maxSizeMB: 0.1,
      maxWidthOrHeight: 600,
    });

    if (upsert) {
      await deleteOldImage({ bucket, path });
    }

    const { data, error } = await supabase
    .storage
    .from(bucket)
    .upload(`${path}/${cleanedImageName}`, compressedImage, {
      cacheControl: '2592000'
    })

    if (error) {
      throw error;
    }

    return getFileUrl({bucketName: bucket, fileName: data?.path || ''});
  } catch (error) {
    throwError(error);
  }
};

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

export { uploadImage, fetchImagesByDirectory, deleteImage, removeBasePath };

import imageCompression from 'browser-image-compression';
import {
  ref,
  uploadBytes,
  listAll,
  getDownloadURL,
  deleteObject,
  getStorage,
} from 'firebase/storage';
import { storage } from './firebase-config';
import { v4 } from 'uuid';

interface uploadImageProps {
  image: File | string;
  path: string;
  name?: string;
}

const uploadImage = async ({ image, path, name }: uploadImageProps) => {
  const prefix = typeof image === 'string' ? '' : image.name;
  const imageName = name ? name : prefix + v4();
  const file =
    typeof image === 'string'
      ? await imageCompression.getFilefromDataUrl(image, imageName)
      : image;

  const compressedImage = await imageCompression(file, {
    maxSizeMB: 0.1,
    maxWidthOrHeight: 600,
  });

  const storageRef = ref(storage, `${path}/${imageName}`);
  const snapshot = await uploadBytes(storageRef, compressedImage);

  const imageUrl = await getDownloadURL(snapshot.ref);
  return imageUrl;
};

const fetchImagesByDirectory = async (path: string) => {
  const imagesRef = ref(storage, path);
  const res = await listAll(imagesRef);
  const images = Promise.all(res.items.map((image) => getDownloadURL(image)));
  return images;
};

const deleteImage = async (path: string) => {
  try {
    const storage = getStorage();
    const ImageRef = ref(storage, path);

    await deleteObject(ImageRef);
  } catch (error) {
    console.error('sorry, there was a problem deleting the image');
  }
};

export { uploadImage, fetchImagesByDirectory, deleteImage };

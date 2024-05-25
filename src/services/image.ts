import imageCompression from 'browser-image-compression';
import { ref, uploadBytes, listAll, getDownloadURL } from 'firebase/storage';
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

  const compressedImage = await imageCompression(file, { maxSizeMB: 0.1 });

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

export { uploadImage, fetchImagesByDirectory };

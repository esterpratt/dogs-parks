import {
  ref,
  uploadBytes,
  listAll,
  getDownloadURL,
  uploadString,
  UploadResult,
} from 'firebase/storage';
import { storage } from './firebase-config';
import { v4 } from 'uuid';

interface uploadImageProps {
  image: File | string;
  path: string;
}

const uploadImage = async ({ image, path }: uploadImageProps) => {
  let imageName = v4();
  let snapshot: UploadResult;

  if (image instanceof File) {
    imageName = `${image.name}${imageName}`;
    const storageRef = ref(storage, `${path}/${imageName}`);
    snapshot = await uploadBytes(storageRef, image);
  } else {
    const storageRef = ref(storage, `${path}/${imageName}`);
    snapshot = await uploadString(storageRef, image, 'data_url');
  }

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

import { ref, uploadBytes, listAll, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase-config';
import { v4 } from 'uuid';

// TODO: what is the type of image?
export type Image = Blob & { name: string };

interface uploadImageProps {
  image: Image;
  path: string;
}

const uploadImage = async ({ image, path }: uploadImageProps) => {
  const imageRef = ref(storage, `${path}/${image.name + v4()}`);
  const snapshot = await uploadBytes(imageRef, image);
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

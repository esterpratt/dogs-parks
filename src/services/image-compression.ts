import imageCompression from 'browser-image-compression';

const compressImage = async (file: File, maxSizeMB = 0.1, maxWidthOrHeight = 800) => {
  return imageCompression(file, {
        maxSizeMB,
        maxWidthOrHeight,
      });
}

const getCompressedImage = async (image: string, name: string) => {
  return imageCompression.getFilefromDataUrl(image, name);
}

export { compressImage, getCompressedImage };

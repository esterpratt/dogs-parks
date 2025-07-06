import imageCompression from 'browser-image-compression';

const compressImage = async (file: File, maxSizeMB = 0.2, maxWidthOrHeight = 1200) => {
  return imageCompression(file, {
        maxSizeMB,
        maxWidthOrHeight,
        initialQuality: 0.9,
        fileType: 'image/webp',
      });
}

const getCompressedImage = async (image: string, name: string) => {
  return imageCompression.getFilefromDataUrl(image, name);
}

export { compressImage, getCompressedImage };

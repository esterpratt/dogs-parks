import imageCompression from 'browser-image-compression';

const canEncodeWebP = async (): Promise<boolean> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');

    if (!canvas.toBlob) {
      return resolve(false);
    }

    canvas.toBlob((blob) => {
      resolve(blob?.type === 'image/webp');
    }, 'image/webp');
  });
};

const compressImage = async (file: File, maxSizeMB = 0.2, maxWidthOrHeightWebP = 1200,
  maxWidthOrHeightJPEG = 1400) => {
  const canWebP = await canEncodeWebP();
  const format = canWebP ? 'webp' : 'jpeg';

  const compressed = await imageCompression(file, {
    maxSizeMB,
    maxWidthOrHeight: canWebP ? maxWidthOrHeightWebP : maxWidthOrHeightJPEG,
    fileType: `image/${format}`,
    initialQuality: canWebP ? 0.9 : 0.8,
  });

  return { file: compressed, format };
}

const getCompressedImage = async (image: string, name: string) => {
  return imageCompression.getFilefromDataUrl(image, name);
}

export { compressImage, getCompressedImage };

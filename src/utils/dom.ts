interface rotateImageProps {
  imageSrc: string;
  rotation: number;
  cb: (dataUrl: string) => void;
}

const isParentWithId = (target: HTMLElement | null, id: string) => {
  let elementTarget = target;
  while (elementTarget) {
    if (elementTarget.id === id) {
      return true;
    }
    elementTarget = elementTarget.parentElement;
  }
  return false;
};

const rotateImage = ({ imageSrc, rotation, cb }: rotateImageProps) => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const img = new Image();
  img.src = imageSrc;

  img.onload = () => {
    const angle = (rotation * Math.PI) / 180;

    const sin = Math.abs(Math.sin(angle));
    const cos = Math.abs(Math.cos(angle));
    const newWidth = img.width * cos + img.height * sin;
    const newHeight = img.width * sin + img.height * cos;

    canvas.width = newWidth;
    canvas.height = newHeight;

    ctx!.clearRect(0, 0, canvas.width, canvas.height);
    ctx!.save();
    ctx!.translate(newWidth / 2, newHeight / 2);
    ctx!.rotate(angle);
    ctx!.drawImage(img, -img.width / 2, -img.height / 2);
    ctx!.restore();

    const dataUrl = canvas.toDataURL('image/jpeg');

    cb(dataUrl);
  };
};

export { isParentWithId, rotateImage };

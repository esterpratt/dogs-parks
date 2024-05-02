import React, { useCallback, useRef, useState } from 'react';
import Webcam, { WebcamProps } from 'react-webcam';
import styles from './Camera.module.scss';
import { Button } from '../Button';

interface CustomWebcamProps {
  onSaveImg: (img: string) => void;
  onError?: (error: string | DOMException) => void;
  onCancel?: () => void;
}

const videoConstraints: WebcamProps['videoConstraints'] = {
  facingMode: 'environment',
};

const Camera: React.FC<CustomWebcamProps> = ({
  onSaveImg,
  onError,
  onCancel,
}) => {
  const webcamRef = useRef<Webcam>(null);
  const [img, setImg] = useState<string | null>(null);

  const captureImg = useCallback(() => {
    setImg(webcamRef.current!.getScreenshot());
  }, [webcamRef]);

  const recapture = () => {
    setImg(null);
  };

  return (
    <div className={styles.camera}>
      {img ? (
        <>
          <img src={img} alt="screenshot" />
          <Button className={styles.saveButton} onClick={() => onSaveImg(img)}>
            Save
          </Button>
          <Button className={styles.recaptureButton} onClick={recapture}>
            Recapture
          </Button>
        </>
      ) : (
        <>
          <Webcam
            ref={webcamRef}
            videoConstraints={videoConstraints}
            onUserMediaError={onError}
          />
          <Button onClick={captureImg} className={styles.captureButton}>
            Capture
          </Button>
          <Button onClick={onCancel} className={styles.cancelButton}>
            Cancel
          </Button>
        </>
      )}
    </div>
  );
};

export { Camera };

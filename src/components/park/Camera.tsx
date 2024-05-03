import React, { useCallback, useRef, useState } from 'react';
import Webcam, { WebcamProps } from 'react-webcam';
import { FaRegDotCircle } from 'react-icons/fa';
import { FaArrowRotateRight } from 'react-icons/fa6';
import { MdOutlineSave } from 'react-icons/md';
import { CgClose } from 'react-icons/cg';
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
      <Button onClick={onCancel} className={styles.cancelButton}>
        <CgClose size="32" />
      </Button>
      {img ? (
        <>
          <img src={img} alt="screenshot" />
          <div className={styles.buttonsContainer}>
            <Button
              className={styles.saveButton}
              onClick={() => onSaveImg(img)}
            >
              <MdOutlineSave size="48" />
            </Button>
            <Button className={styles.recaptureButton} onClick={recapture}>
              <FaArrowRotateRight size="48" />
            </Button>
          </div>
        </>
      ) : (
        <>
          <Webcam
            ref={webcamRef}
            videoConstraints={videoConstraints}
            onUserMediaError={onError}
          />
          <Button onClick={captureImg} className={styles.captureButton}>
            <FaRegDotCircle size="48" />
          </Button>
        </>
      )}
    </div>
  );
};

export { Camera };

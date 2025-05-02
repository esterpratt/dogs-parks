import React, { useCallback, useEffect, useRef, useState } from 'react';
import { RefreshCcw, RotateCcw, RotateCw, X } from 'lucide-react';
import Webcam from 'react-webcam';
import { Button } from '../Button';
import { rotateImage } from '../../utils/dom';
import styles from './Camera.module.scss';

interface CustomWebcamProps {
  onSaveImg: (img: string) => void;
  onError?: (error: string | DOMException) => void;
  onClose: () => void;
  isOpen: boolean;
}

const Camera: React.FC<CustomWebcamProps> = ({
  onSaveImg,
  onError,
  onClose,
  isOpen,
}) => {
  const webcamRef = useRef<Webcam>(null);
  const [img, setImg] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState('environment');

  useEffect(() => {
    if (isOpen) {
      setImg(null);
    }
  }, [isOpen]);

  const captureImg = useCallback(() => {
    setImg(webcamRef.current!.getScreenshot());
  }, [webcamRef, setImg]);

  const recapture = () => {
    setImg(null);
  };

  const onClickSaveImage = () => {
    onSaveImg(img!);
  };

  const rotateImgLeft = () => {
    rotateImage({ imageSrc: img!, rotation: -90, cb: setImg });
  };

  const rotateImgRight = () => {
    rotateImage({ imageSrc: img!, rotation: 90, cb: setImg });
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className={styles.camera}>
      {img ? (
        <>
          <Button
            onClick={onClose}
            variant="simple"
            className={styles.closeButton}
          >
            <X size={24} />
          </Button>

          <div className={styles.imgContainer}>
            <img src={img} alt="screenshot" className={styles.cameraView} />
          </div>
          <div className={styles.buttonsContainer}>
            <div className={styles.rotationButtons}>
              <Button variant="simple" onClick={rotateImgLeft}>
                <RotateCcw size={24} />
              </Button>
              <Button variant="simple" onClick={rotateImgRight}>
                <RotateCw size={24} />
              </Button>
            </div>
            <Button
              className={styles.recaptureButton}
              onClick={recapture}
              variant="simple"
            >
              Recapture
            </Button>
            <Button
              className={styles.saveButton}
              onClick={onClickSaveImage}
              variant="simple"
            >
              Save
            </Button>
          </div>
        </>
      ) : (
        <>
          <div className={styles.webcamContainer}>
            <Webcam
              ref={webcamRef}
              videoConstraints={{ facingMode }}
              onUserMediaError={onError}
              className={styles.cameraView}
              mirrored={facingMode === 'user'}
            />
          </div>
          <div className={styles.captureButtonsContainer}>
            <Button onClick={onClose} variant="simple">
              <X size={36} />
            </Button>
            <Button
              onClick={captureImg}
              className={styles.captureButton}
              variant="simple"
            >
              <div className={styles.inner} />
            </Button>
            <Button
              onClick={() =>
                setFacingMode((prev) =>
                  prev === 'environment' ? 'user' : 'environment'
                )
              }
              className={styles.rotateButton}
              variant="simple"
            >
              <RefreshCcw size={36} />
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export { Camera };

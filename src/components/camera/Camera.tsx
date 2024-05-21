import React, { useCallback, useRef, useState } from 'react';
import Webcam from 'react-webcam';
import { FaArrowsRotate } from 'react-icons/fa6';
import styles from './Camera.module.scss';
import { Button } from '../Button';
import { IconContext } from 'react-icons';
import { CgClose } from 'react-icons/cg';

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

  const captureImg = useCallback(() => {
    setImg(webcamRef.current!.getScreenshot());
  }, [webcamRef]);

  const recapture = () => {
    setImg(null);
  };

  const onClickSaveImage = () => {
    onSaveImg(img!);
  };

  return (
    <div className={styles.camera}>
      {img ? (
        <>
          <img src={img} alt="screenshot" className={styles.cameraView} />
          <div className={styles.buttonsContainer}>
            <Button className={styles.saveButton} onClick={onClickSaveImage}>
              Save
            </Button>
            <Button className={styles.recaptureButton} onClick={recapture}>
              Recapture
            </Button>
          </div>
        </>
      ) : (
        <>
          {isOpen && (
            <Webcam
              ref={webcamRef}
              videoConstraints={{ facingMode }}
              onUserMediaError={onError}
              className={styles.cameraView}
              mirrored
            />
          )}
          <div className={styles.captureButtonsContainer}>
            <IconContext.Provider value={{ className: styles.icons }}>
              <Button onClick={onClose}>
                <CgClose />
              </Button>
              <Button onClick={captureImg} className={styles.captureButton}>
                <div className={styles.inner} />
              </Button>
              <Button
                onClick={() =>
                  setFacingMode((prev) =>
                    prev === 'environment' ? 'user' : 'environment'
                  )
                }
                className={styles.rotateButton}
              >
                <FaArrowsRotate />
              </Button>
            </IconContext.Provider>
          </div>
        </>
      )}
    </div>
  );
};

export { Camera };

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Webcam from 'react-webcam';
import { IconContext } from 'react-icons';
import { FaArrowsRotate } from 'react-icons/fa6';
import { CgClose } from 'react-icons/cg';
import { AiOutlineRotateLeft } from 'react-icons/ai';
import { AiOutlineRotateRight } from 'react-icons/ai';
import styles from './Camera.module.scss';
import { Button } from '../Button';
import { rotateImage } from '../../utils/dom';

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
          <div className={styles.imgContainer}>
            <img src={img} alt="screenshot" className={styles.cameraView} />
          </div>
          <div className={styles.buttonsContainer}>
            <div className={styles.rotationButtons}>
              <IconContext.Provider value={{ className: styles.icons }}>
                <AiOutlineRotateLeft onClick={rotateImgLeft} />
                <AiOutlineRotateRight onClick={rotateImgRight} />
              </IconContext.Provider>
            </div>
            <Button className={styles.recaptureButton} onClick={recapture}>
              Recapture
            </Button>
            <Button className={styles.saveButton} onClick={onClickSaveImage}>
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

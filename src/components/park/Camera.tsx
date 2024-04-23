import React, { useCallback, useRef, useState } from 'react';
import Webcam, { WebcamProps } from 'react-webcam';

interface CustomWebcamProps {
  onSaveImg: (img: string) => void;
}

const videoConstraints: WebcamProps['videoConstraints'] = {
  facingMode: 'environment',
};

const Camera: React.FC<CustomWebcamProps> = ({ onSaveImg }) => {
  const webcamRef = useRef<Webcam>(null);
  const [img, setImg] = useState<string | null>(null);

  const captureImg = useCallback(() => {
    setImg(webcamRef.current!.getScreenshot());
  }, [webcamRef]);

  const recapture = () => {
    setImg(null);
  };

  return (
    <div style={{ width: '500px', height: '400px' }}>
      {img ? (
        <>
          <img src={img} alt="screenshot" />
          <button onClick={() => onSaveImg(img)}>Save</button>
          <button onClick={recapture}>Recapture</button>
        </>
      ) : (
        <>
          <Webcam ref={webcamRef} videoConstraints={videoConstraints} />
          <button onClick={captureImg}>Capture</button>
        </>
      )}
    </div>
  );
};

export { Camera };

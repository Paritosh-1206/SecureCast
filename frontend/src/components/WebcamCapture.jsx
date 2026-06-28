// components/WebcamCapture.jsx — Webcam capture component for face images
import { useRef, useCallback, useState } from 'react';
import Webcam from 'react-webcam';
import { motion } from 'framer-motion';
import { HiOutlineCamera, HiOutlineRefresh } from 'react-icons/hi';

const videoConstraints = {
  width: 480,
  height: 360,
  facingMode: 'user',
};

const WebcamCapture = ({ onCapture, showGuide = true }) => {
  const webcamRef = useRef(null);
  const [captured, setCaptured] = useState(null);

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setCaptured(imageSrc);
      // Remove data URI prefix for API
      const base64 = imageSrc.split(',')[1];
      onCapture?.(base64, imageSrc);
    }
  }, [onCapture]);

  const retake = () => {
    setCaptured(null);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="webcam-container w-full max-w-md">
        {captured ? (
          <img src={captured} alt="Captured face" className="w-full rounded-xl" />
        ) : (
          <div className="relative">
            <Webcam
              ref={webcamRef}
              audio={false}
              screenshotFormat="image/jpeg"
              videoConstraints={videoConstraints}
              className="w-full rounded-xl"
              mirrored
            />
            {showGuide && (
              <div className="webcam-overlay">
                <div className="face-guide" />
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex gap-3">
        {captured ? (
          <>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={retake}
              className="btn btn-ghost"
            >
              <HiOutlineRefresh className="w-4 h-4" />
              Retake
            </motion.button>
          </>
        ) : (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={capture}
            className="btn btn-primary px-8"
          >
            <HiOutlineCamera className="w-4 h-4" />
            Capture Photo
          </motion.button>
        )}
      </div>
    </div>
  );
};

export default WebcamCapture;

// components/LivenessChallenge.jsx — Liveness detection UI with real-time prompts
import { useRef, useState, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineEye, HiOutlineArrowLeft, HiOutlineArrowRight } from 'react-icons/hi';

const videoConstraints = {
  width: 480,
  height: 360,
  facingMode: 'user',
};

const CAPTURE_INTERVAL = 200; // ms between frame captures
const TOTAL_CAPTURE_TIME = 6000; // Total capture time in ms

const LivenessChallenge = ({ onComplete, onCancel }) => {
  const webcamRef = useRef(null);
  const [phase, setPhase] = useState('ready'); // ready, blink, yaw, capturing, done
  const [progress, setProgress] = useState(0);
  const [frames, setFrames] = useState([]);
  const [captureStarted, setCaptureStarted] = useState(false);

  const startCapture = useCallback(() => {
    setPhase('capturing');
    setCaptureStarted(true);
    setFrames([]);
    setProgress(0);

    const collectedFrames = [];
    const startTime = Date.now();

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min((elapsed / TOTAL_CAPTURE_TIME) * 100, 100);
      setProgress(pct);

      // Capture frame
      const screenshot = webcamRef.current?.getScreenshot();
      if (screenshot) {
        const base64 = screenshot.split(',')[1];
        collectedFrames.push(base64);
      }

      // Update phase prompts based on progress
      if (pct < 40) {
        setPhase('blink');
      } else if (pct < 85) {
        setPhase('yaw');
      }

      if (elapsed >= TOTAL_CAPTURE_TIME) {
        clearInterval(interval);
        setPhase('done');
        setFrames(collectedFrames);
        onComplete?.(collectedFrames);
      }
    }, CAPTURE_INTERVAL);

    return () => clearInterval(interval);
  }, [onComplete]);

  const phaseConfig = {
    ready: {
      title: 'Liveness Check',
      subtitle: 'Position your face in the frame and click Start',
      icon: '🔐',
    },
    blink: {
      title: 'Please Blink',
      subtitle: 'Blink your eyes naturally a few times',
      icon: '👁️',
    },
    yaw: {
      title: 'Turn Your Head',
      subtitle: 'Slowly turn your head left and right',
      icon: '↔️',
    },
    capturing: {
      title: 'Processing...',
      subtitle: 'Hold still, capturing frames',
      icon: '📸',
    },
    done: {
      title: 'Capture Complete',
      subtitle: 'Analyzing liveness...',
      icon: '✅',
    },
  };

  const currentPhase = phaseConfig[phase] || phaseConfig.ready;

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Phase indicator */}
      <AnimatePresence mode="wait">
        <motion.div
          key={phase}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="text-center"
        >
          <div className="text-3xl mb-2">{currentPhase.icon}</div>
          <h3 className="text-lg font-semibold text-text-primary">{currentPhase.title}</h3>
          <p className="text-sm text-text-secondary">{currentPhase.subtitle}</p>
        </motion.div>
      </AnimatePresence>

      {/* Webcam */}
      <div className="webcam-container w-full max-w-md">
        <Webcam
          ref={webcamRef}
          audio={false}
          screenshotFormat="image/jpeg"
          videoConstraints={videoConstraints}
          className="w-full rounded-xl"
          mirrored
        />

        {/* Visual prompts overlay */}
        {phase === 'blink' && (
          <div className="webcam-overlay">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="flex items-center gap-3"
            >
              <HiOutlineEye className="w-12 h-12 text-primary-light drop-shadow-lg" />
            </motion.div>
          </div>
        )}

        {phase === 'yaw' && (
          <div className="webcam-overlay">
            <motion.div
              animate={{ x: [-40, 40, -40] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="flex items-center gap-4"
            >
              <HiOutlineArrowLeft className="w-10 h-10 text-accent drop-shadow-lg" />
              <HiOutlineArrowRight className="w-10 h-10 text-accent drop-shadow-lg" />
            </motion.div>
          </div>
        )}
      </div>

      {/* Progress bar */}
      {captureStarted && (
        <div className="w-full max-w-md">
          <div className="h-2 bg-surface-lighter rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
              style={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <p className="text-xs text-text-muted mt-1 text-center">
            {Math.round(progress)}% — {frames.length || Math.round(progress / 100 * (TOTAL_CAPTURE_TIME / CAPTURE_INTERVAL))} frames captured
          </p>
        </div>
      )}

      {/* Controls */}
      <div className="flex gap-3">
        {phase === 'ready' && (
          <>
            <button onClick={onCancel} className="btn btn-ghost">Cancel</button>
            <button onClick={startCapture} className="btn btn-primary px-8">
              Start Liveness Check
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default LivenessChallenge;

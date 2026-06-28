// pages/FaceSetup.jsx — Separate face registration step (post-registration)
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import WebcamCapture from '../components/WebcamCapture';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const FaceSetup = () => {
  const navigate = useNavigate();
  const { updateUser } = useAuth();
  const [capturedImage, setCapturedImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleCapture = (base64) => {
    setCapturedImage(base64);
  };

  const handleSubmit = async () => {
    if (!capturedImage) {
      return toast.error('Please capture your face photo first');
    }

    setLoading(true);
    try {
      await API.post('/auth/setup-face', { image: capturedImage });
      updateUser({ faceSetupComplete: true });
      toast.success('Face ID setup complete! 🎉');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Face setup failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-radial flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xl"
      >
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🪪</div>
          <h1 className="text-2xl font-bold text-text-primary">Set Up Face ID</h1>
          <p className="text-text-secondary mt-2 max-w-md mx-auto">
            We'll capture your face to create a secure biometric profile.
            This is used for identity verification during voting.
          </p>
        </div>

        <div className="glass rounded-2xl p-8">
          <div className="space-y-4 mb-6">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-light border border-border">
              <span className="text-lg">💡</span>
              <p className="text-sm text-text-secondary">
                Ensure good lighting and face the camera directly. Remove glasses if possible.
              </p>
            </div>
          </div>

          <WebcamCapture onCapture={handleCapture} showGuide />

          {capturedImage && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 flex justify-center"
            >
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="btn btn-accent px-10 h-12 text-base"
              >
                {loading ? <LoadingSpinner size="sm" /> : '✓ Save Face ID'}
              </button>
            </motion.div>
          )}

          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-sm text-text-muted hover:text-text-primary transition"
            >
              Skip for now →
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default FaceSetup;

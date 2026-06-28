// components/LoadingSpinner.jsx — Animated loading spinner
import { motion } from 'framer-motion';

const LoadingSpinner = ({ fullScreen = false, size = 'md', text = '' }) => {
  const sizes = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
  };

  const spinner = (
    <div className={`flex flex-col items-center gap-3 ${fullScreen ? '' : ''}`}>
      <motion.div
        className={`${sizes[size]} rounded-full border-3 border-surface-lighter`}
        style={{
          borderTopColor: '#4F46E5',
          borderRightColor: '#6366F1',
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      />
      {text && (
        <p className="text-sm text-text-secondary animate-pulse">{text}</p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-surface/80 backdrop-blur-sm z-50">
        {spinner}
      </div>
    );
  }

  return spinner;
};

export default LoadingSpinner;

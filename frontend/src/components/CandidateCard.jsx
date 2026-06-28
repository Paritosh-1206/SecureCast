// components/CandidateCard.jsx — Candidate display card
import { motion } from 'framer-motion';
import { HiOutlineDocumentText } from 'react-icons/hi';

const CandidateCard = ({
  candidate,
  index = 0,
  selectable = false,
  selected = false,
  onSelect,
}) => {
  const user = candidate.userId || {};
  const initials = (user.name || 'U').charAt(0).toUpperCase();

  // Generate a deterministic gradient for each candidate
  const gradients = [
    'from-violet-500 to-purple-600',
    'from-blue-500 to-cyan-600',
    'from-emerald-500 to-teal-600',
    'from-orange-500 to-red-600',
    'from-pink-500 to-rose-600',
    'from-indigo-500 to-blue-600',
  ];
  const gradient = gradients[index % gradients.length];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.08 }}
      onClick={() => selectable && onSelect?.(candidate)}
      className={`card cursor-${selectable ? 'pointer' : 'default'} ${
        selected
          ? 'border-primary ring-2 ring-primary/30 bg-primary/5'
          : ''
      } ${selectable ? 'hover:border-primary/50' : ''}`}
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0 shadow-lg`}>
          <span className="text-xl font-bold text-white">{initials}</span>
        </div>

        <div className="flex-1 min-w-0">
          {/* Name & Party */}
          <h4 className="font-semibold text-text-primary truncate">
            {user.name || 'Unknown'}
          </h4>
          <p className="text-sm text-primary-light font-medium">
            {candidate.partyName || 'Independent'}
          </p>

          {/* Candidate Number */}
          {candidate.candidateNumber && (
            <span className="badge badge-primary mt-1 text-[10px]">
              #{candidate.candidateNumber}
            </span>
          )}

          {/* Status */}
          {candidate.status && !selectable && (
            <span className={`badge mt-1 text-[10px] ${
              candidate.status === 'approved' ? 'badge-success' :
              candidate.status === 'rejected' ? 'badge-danger' : 'badge-warning'
            }`}>
              {candidate.status}
            </span>
          )}
        </div>

        {/* Selection indicator */}
        {selectable && (
          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition ${
            selected
              ? 'border-primary bg-primary'
              : 'border-surface-lighter'
          }`}>
            {selected && (
              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
        )}
      </div>

      {/* Manifesto preview */}
      {candidate.manifesto && (
        <div className="mt-3 pt-3 border-t border-border">
          <div className="flex items-center gap-1.5 text-xs text-text-muted mb-1">
            <HiOutlineDocumentText className="w-3.5 h-3.5" />
            <span>Manifesto</span>
          </div>
          <p className="text-sm text-text-secondary line-clamp-3">
            {candidate.manifesto}
          </p>
        </div>
      )}
    </motion.div>
  );
};

export default CandidateCard;

// components/ElectionCard.jsx — Election display card with status and countdown
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiOutlineClock, HiOutlineUserGroup, HiOutlineChartBar } from 'react-icons/hi';
import { HiOutlineCheckBadge } from 'react-icons/hi2';
import { useState, useEffect } from 'react';

const ElectionCard = ({ election, index = 0 }) => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const target = election.status === 'upcoming'
        ? new Date(election.startTime)
        : new Date(election.endTime);

      const diff = target - now;
      if (diff <= 0) {
        setTimeLeft(election.status === 'upcoming' ? 'Starting soon...' : 'Ended');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);

      if (days > 0) setTimeLeft(`${days}d ${hours}h ${minutes}m`);
      else if (hours > 0) setTimeLeft(`${hours}h ${minutes}m`);
      else setTimeLeft(`${minutes}m`);
    };

    updateTimer();
    const iv = setInterval(updateTimer, 60000);
    return () => clearInterval(iv);
  }, [election]);

  const statusConfig = {
    upcoming: { badge: 'badge-info', label: 'Upcoming', icon: HiOutlineClock },
    active: { badge: 'badge-success', label: 'Active', icon: HiOutlineCheckBadge },
    ended: { badge: 'badge-warning', label: 'Ended', icon: HiOutlineChartBar },
  };

  const config = statusConfig[election.status] || statusConfig.upcoming;
  const StatusIcon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Link to={`/elections/${election._id}`} className="block">
        <div className="card group cursor-pointer">
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-lg font-semibold text-text-primary group-hover:text-primary-light transition">
              {election.title}
            </h3>
            <span className={`badge ${config.badge}`}>
              <StatusIcon className="w-3 h-3" />
              {config.label}
            </span>
          </div>

          {election.description && (
            <p className="text-sm text-text-secondary mb-4 line-clamp-2">
              {election.description}
            </p>
          )}

          <div className="flex items-center gap-4 text-xs text-text-muted">
            <div className="flex items-center gap-1.5">
              <HiOutlineClock className="w-3.5 h-3.5" />
              <span>{timeLeft}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <HiOutlineUserGroup className="w-3.5 h-3.5" />
              <span>{election.approvedCandidateCount || 0} candidates</span>
            </div>
            {election.isResultPublished && (
              <div className="flex items-center gap-1.5 text-accent">
                <HiOutlineChartBar className="w-3.5 h-3.5" />
                <span>Results published</span>
              </div>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default ElectionCard;

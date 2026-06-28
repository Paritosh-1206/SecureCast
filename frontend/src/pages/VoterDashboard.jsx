// pages/VoterDashboard.jsx — Voter/Candidate dashboard showing elections
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import Navbar from '../components/Navbar';
import ElectionCard from '../components/ElectionCard';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  HiOutlineClipboardList, HiOutlineCheckCircle, HiOutlineClock,
  HiOutlineExclamationCircle, HiOutlineShieldExclamation,
} from 'react-icons/hi';
import { HiOutlineUserPlus, HiOutlineBolt } from 'react-icons/hi2';

const VoterDashboard = () => {
  const { user } = useAuth();
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchElections();
  }, []);

  const fetchElections = async () => {
    try {
      const res = await API.get('/elections');
      setElections(res.data.data);
    } catch (err) {
      console.error('Failed to fetch elections:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = filter === 'all'
    ? elections
    : elections.filter((e) => e.status === filter);

  const stats = {
    total: elections.length,
    active: elections.filter((e) => e.status === 'active').length,
    upcoming: elections.filter((e) => e.status === 'upcoming').length,
  };

  return (
    <div className="min-h-screen bg-gradient-radial">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Welcome */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-2xl font-bold text-text-primary">
            Welcome, {user?.name} 👋
          </h1>
          <p className="text-text-secondary mt-1">
            View available elections and cast your vote securely.
          </p>
        </motion.div>

        {/* Status Banners */}
        <div className="space-y-3 mb-8">
          {!user?.isApproved && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 p-4 rounded-xl bg-warning/8 border border-warning/25"
            >
              <HiOutlineExclamationCircle className="w-5 h-5 text-warning flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-warning">Account Pending Approval</p>
                <p className="text-xs text-text-muted mt-0.5">
                  Your account is awaiting admin approval. You won't be able to vote until approved.
                </p>
              </div>
            </motion.div>
          )}

          {!user?.faceSetupComplete && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex items-center justify-between gap-3 p-4 rounded-xl bg-info/8 border border-info/25"
            >
              <div className="flex items-center gap-3">
                <HiOutlineBolt className="w-5 h-5 text-info flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-info">Face ID Not Set Up</p>
                  <p className="text-xs text-text-muted mt-0.5">
                    Complete face registration to enable secure voting.
                  </p>
                </div>
              </div>
              <Link to="/face-setup" className="btn btn-primary text-xs py-1.5 px-4 flex-shrink-0">
                Set Up Now
              </Link>
            </motion.div>
          )}
        </div>

        {/* Stats + Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Elections', value: stats.total, icon: HiOutlineClipboardList, color: 'text-primary-light' },
            { label: 'Active', value: stats.active, icon: HiOutlineCheckCircle, color: 'text-accent' },
            { label: 'Upcoming', value: stats.upcoming, icon: HiOutlineClock, color: 'text-info' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="card flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-xl bg-surface flex items-center justify-center">
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-text-primary">{stat.value}</p>
                <p className="text-xs text-text-muted">{stat.label}</p>
              </div>
            </motion.div>
          ))}

          {/* Apply as Candidate Quick Action */}
          {user?.role !== 'admin' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Link
                to="/candidate/apply"
                className="card flex items-center gap-4 group h-full cursor-pointer border-dashed hover:border-primary/40"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center group-hover:from-primary/30 group-hover:to-accent/30 transition-all">
                  <HiOutlineUserPlus className="w-6 h-6 text-primary-light" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-primary group-hover:text-primary-light transition">Apply as Candidate</p>
                  <p className="text-xs text-text-muted">Run in an election</p>
                </div>
              </Link>
            </motion.div>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6">
          {['all', 'active', 'upcoming', 'ended'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition capitalize ${
                filter === f
                  ? 'bg-primary/20 text-primary-light border border-primary/30'
                  : 'text-text-muted hover:text-text-secondary hover:bg-surface-light'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Elections grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner text="Loading elections..." />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🗳️</div>
            <p className="text-text-secondary text-lg font-medium">No elections found</p>
            <p className="text-text-muted text-sm mt-1">
              {filter !== 'all'
                ? `No ${filter} elections at the moment. Try a different filter.`
                : 'Check back later for upcoming elections.'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((election, i) => (
              <ElectionCard key={election._id} election={election} index={i} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default VoterDashboard;

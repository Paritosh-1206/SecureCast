// pages/ElectionDetail.jsx — Election details with candidates and actions
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import Navbar from '../components/Navbar';
import CandidateCard from '../components/CandidateCard';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';
import { HiOutlineClock, HiOutlineUserGroup, HiOutlineChartBar } from 'react-icons/hi';
import { HiOutlineUserPlus } from 'react-icons/hi2';

const ElectionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [election, setElection] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [voteStatus, setVoteStatus] = useState(null);
  const [myApplication, setMyApplication] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [elRes, statusRes] = await Promise.all([
          API.get(`/elections/${id}`),
          API.get(`/vote/status/${id}`),
        ]);
        setElection(elRes.data.data.election);
        setCandidates(elRes.data.data.candidates);
        setVoteStatus(statusRes.data.data);

        // Check if user has already applied as candidate
        if (user?.role !== 'admin') {
          try {
            const appRes = await API.get('/candidates/my-applications');
            const apps = appRes.data.data;
            const thisApp = apps.find((a) => a.electionId?._id === id || a.electionId === id);
            if (thisApp) setMyApplication(thisApp);
          } catch { /* ignore */ }
        }
      } catch (err) { toast.error('Failed to load election'); }
      finally { setLoading(false); }
    };
    load();
  }, [id, user]);

  if (loading) return <><Navbar /><LoadingSpinner fullScreen /></>;
  if (!election) return <><Navbar /><div className="text-center py-20 text-text-secondary">Election not found</div></>;

  const canApply = election.status === 'upcoming' && user?.role !== 'admin' && !myApplication;

  return (
    <div className="min-h-screen bg-gradient-radial">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold text-text-primary">{election.title}</h1>
              {election.description && <p className="text-text-secondary mt-1">{election.description}</p>}
            </div>
            <span className={`badge ${election.status === 'active' ? 'badge-success' : election.status === 'ended' ? 'badge-warning' : 'badge-info'}`}>{election.status}</span>
          </div>
          <div className="flex flex-wrap gap-6 mt-4 text-sm text-text-muted">
            <span className="flex items-center gap-1.5"><HiOutlineClock className="w-4 h-4" /> Start: {new Date(election.startTime).toLocaleString()}</span>
            <span className="flex items-center gap-1.5"><HiOutlineClock className="w-4 h-4" /> End: {new Date(election.endTime).toLocaleString()}</span>
            <span className="flex items-center gap-1.5"><HiOutlineUserGroup className="w-4 h-4" /> {candidates.length} candidates</span>
          </div>
          {election.contractAddress && (
            <p className="text-xs text-text-muted font-mono mt-2">📜 Contract: {election.contractAddress}</p>
          )}
        </motion.div>

        {/* Vote Status Banner */}
        {voteStatus?.hasVoted && (
          <div className="mb-6 p-4 rounded-xl bg-accent/10 border border-accent/30 flex items-center gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <p className="font-semibold text-accent">You have already voted!</p>
              <p className="text-xs text-text-muted">TX: {voteStatus.vote?.txHash?.slice(0, 24)}...</p>
            </div>
          </div>
        )}

        {/* Candidate Application Status */}
        {myApplication && (
          <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
            myApplication.status === 'approved' ? 'bg-accent/10 border border-accent/30' :
            myApplication.status === 'rejected' ? 'bg-danger/10 border border-danger/30' :
            'bg-warning/10 border border-warning/30'
          }`}>
            <span className="text-2xl">
              {myApplication.status === 'approved' ? '🎉' : myApplication.status === 'rejected' ? '❌' : '⏳'}
            </span>
            <div>
              <p className={`font-semibold ${
                myApplication.status === 'approved' ? 'text-accent' :
                myApplication.status === 'rejected' ? 'text-danger' : 'text-warning'
              }`}>
                Candidate Application: {myApplication.status.charAt(0).toUpperCase() + myApplication.status.slice(1)}
              </p>
              <p className="text-xs text-text-muted">
                Party: {myApplication.partyName}
                {myApplication.status === 'pending' && ' — Awaiting admin review'}
              </p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-3 mb-8">
          {election.status === 'active' && !voteStatus?.hasVoted && (
            <button onClick={() => navigate(`/vote/${election._id}`)} className="btn btn-primary px-8">🗳️ Cast Your Vote</button>
          )}
          {(election.isResultPublished || user?.role === 'admin') && election.contractAddress && (
            <button onClick={() => navigate(`/results/${election._id}`)} className="btn btn-ghost">
              <HiOutlineChartBar className="w-4 h-4" />View Results
            </button>
          )}
          {canApply && (
            <Link to={`/candidate/apply?election=${election._id}`} className="btn btn-accent">
              <HiOutlineUserPlus className="w-4 h-4" />Apply as Candidate
            </Link>
          )}
        </div>

        <h2 className="text-lg font-semibold text-text-primary mb-4">Candidates</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {candidates.map((c, i) => <CandidateCard key={c._id} candidate={c} index={i} />)}
          {candidates.length === 0 && (
            <div className="text-center py-12 text-text-muted col-span-2">
              <div className="text-4xl mb-3">👥</div>
              <p>No approved candidates yet</p>
              {election.status === 'upcoming' && user?.role !== 'admin' && !myApplication && (
                <Link to={`/candidate/apply?election=${election._id}`} className="btn btn-accent mt-4 inline-flex">
                  <HiOutlineUserPlus className="w-4 h-4" />Be the first to apply!
                </Link>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ElectionDetail;

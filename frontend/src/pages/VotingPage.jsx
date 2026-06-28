// pages/VotingPage.jsx — Multi-step voting flow: OTP → Liveness → Face → Select → Confirm
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import Navbar from '../components/Navbar';
import OtpInput from '../components/OtpInput';
import LivenessChallenge from '../components/LivenessChallenge';
import WebcamCapture from '../components/WebcamCapture';
import CandidateCard from '../components/CandidateCard';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const STEPS = ['OTP Verification', 'Liveness Check', 'Face Verification', 'Select Candidate', 'Confirm Vote'];

const VotingPage = () => {
  const { id: electionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [voteResult, setVoteResult] = useState(null);
  const [election, setElection] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await API.get(`/elections/${electionId}`);
        setElection(res.data.data.election);
        setCandidates(res.data.data.candidates);
        // Send OTP automatically
        await API.post('/vote/send-otp', { electionId });
        toast.success('OTP sent to your email');
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to start voting');
        navigate(`/elections/${electionId}`);
      }
    };
    load();
  }, [electionId]);

  // Step 1: Verify OTP
  const handleOtpComplete = async (otp) => {
    setLoading(true);
    try {
      await API.post('/vote/verify-otp', { otp });
      toast.success('OTP verified!');
      setStep(1);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP');
    } finally { setLoading(false); }
  };

  // Step 2: Liveness check
  const handleLivenessComplete = async (frames) => {
    setLoading(true);
    try {
      const res = await API.post('/vote/liveness', { frames });
      if (res.data.data?.passed) {
        toast.success('Liveness verified!');
        setStep(2);
      } else {
        toast.error('Liveness check failed. Try again.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Liveness check failed');
    } finally { setLoading(false); }
  };

  // Step 3: Face verification
  const handleFaceCapture = async (base64) => {
    setLoading(true);
    try {
      const res = await API.post('/vote/verify-face', { image: base64 });
      toast.success(`Face verified! Similarity: ${(res.data.data.similarity * 100).toFixed(1)}%`);
      setStep(3);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Face verification failed');
    } finally { setLoading(false); }
  };

  // Step 5: Cast vote
  const handleCastVote = async () => {
    if (!selectedCandidate) return;
    setLoading(true);
    try {
      const res = await API.post('/vote/cast', {
        electionId,
        candidateId: selectedCandidate.candidateNumber,
      });
      setVoteResult(res.data.data);
      toast.success('Vote cast successfully! 🎉');
      setStep(5);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cast vote');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-radial">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {STEPS.map((s, i) => (
              <div key={s} className={`text-xs font-medium ${i <= step ? 'text-primary-light' : 'text-text-muted'}`}>
                {i < step ? '✓' : i + 1}
              </div>
            ))}
          </div>
          <div className="h-1.5 bg-surface-lighter rounded-full">
            <motion.div
              className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
              animate={{ width: `${(step / (STEPS.length - 1)) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <p className="text-center text-sm text-text-secondary mt-2">{STEPS[Math.min(step, STEPS.length - 1)]}</p>
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: OTP */}
          {step === 0 && (
            <motion.div key="otp" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}
              className="glass rounded-2xl p-8 text-center">
              <div className="text-4xl mb-4">🔐</div>
              <h2 className="text-xl font-bold text-text-primary mb-2">Enter Voting OTP</h2>
              <p className="text-sm text-text-secondary mb-6">A 6-digit code was sent to your email</p>
              <OtpInput onComplete={handleOtpComplete} disabled={loading} />
              {loading && <LoadingSpinner size="sm" text="Verifying OTP..." />}
            </motion.div>
          )}

          {/* Step 2: Liveness */}
          {step === 1 && (
            <motion.div key="liveness" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}
              className="glass rounded-2xl p-8">
              {loading ? <LoadingSpinner text="Analyzing liveness..." /> : (
                <LivenessChallenge onComplete={handleLivenessComplete} onCancel={() => navigate(`/elections/${electionId}`)} />
              )}
            </motion.div>
          )}

          {/* Step 3: Face */}
          {step === 2 && (
            <motion.div key="face" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}
              className="glass rounded-2xl p-8 text-center">
              <div className="text-4xl mb-4">🪪</div>
              <h2 className="text-xl font-bold text-text-primary mb-2">Face Verification</h2>
              <p className="text-sm text-text-secondary mb-6">Look at the camera to verify your identity</p>
              {loading ? <LoadingSpinner text="Verifying face..." /> : <WebcamCapture onCapture={handleFaceCapture} />}
            </motion.div>
          )}

          {/* Step 4: Select Candidate */}
          {step === 3 && (
            <motion.div key="select" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}>
              <h2 className="text-xl font-bold text-text-primary mb-4">Select Your Candidate</h2>
              <div className="grid gap-4 sm:grid-cols-2 mb-6">
                {candidates.map((c, i) => (
                  <CandidateCard key={c._id} candidate={c} index={i} selectable selected={selectedCandidate?._id === c._id}
                    onSelect={() => setSelectedCandidate(c)} />
                ))}
              </div>
              {selectedCandidate && (
                <div className="flex justify-center">
                  <button onClick={() => setStep(4)} className="btn btn-primary px-10">
                    Continue with {selectedCandidate.userId?.name}
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* Step 5: Confirm */}
          {step === 4 && (
            <motion.div key="confirm" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}
              className="glass rounded-2xl p-8 text-center">
              <div className="text-5xl mb-4">🗳️</div>
              <h2 className="text-xl font-bold text-text-primary mb-2">Confirm Your Vote</h2>
              <p className="text-text-secondary mb-6">
                You are voting for <strong className="text-primary-light">{selectedCandidate?.userId?.name}</strong>
                {' '}({selectedCandidate?.partyName}) in <strong>{election?.title}</strong>
              </p>
              <p className="text-xs text-warning mb-6">⚠️ This action cannot be undone</p>
              <div className="flex justify-center gap-3">
                <button onClick={() => setStep(3)} className="btn btn-ghost">← Change</button>
                <button onClick={handleCastVote} disabled={loading} className="btn btn-accent px-10">
                  {loading ? <LoadingSpinner size="sm" /> : 'Cast Vote'}
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 6: Success */}
          {step === 5 && voteResult && (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="glass rounded-2xl p-8 text-center">
              <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.6 }} className="text-6xl mb-4">🎉</motion.div>
              <h2 className="text-2xl font-bold text-accent mb-2">Vote Cast Successfully!</h2>
              <p className="text-text-secondary mb-6">Your vote has been recorded on the blockchain</p>
              <div className="glass-light rounded-xl p-4 text-left text-sm space-y-2 mb-6">
                <p><span className="text-text-muted">TX Hash:</span> <span className="text-primary-light font-mono text-xs break-all">{voteResult.txHash}</span></p>
                <p><span className="text-text-muted">Block:</span> <span className="text-text-primary">{voteResult.blockNumber}</span></p>
                <p><span className="text-text-muted">Vote Hash:</span> <span className="text-primary-light font-mono text-xs break-all">{voteResult.voteHash}</span></p>
              </div>
              <button onClick={() => navigate('/dashboard')} className="btn btn-primary">Back to Dashboard</button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default VotingPage;

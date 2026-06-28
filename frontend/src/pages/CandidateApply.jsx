// pages/CandidateApply.jsx — Apply as a candidate for an election
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import API from '../api/axios';
import Navbar from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const CandidateApply = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedElection = searchParams.get('election');

  const [elections, setElections] = useState([]);
  const [myApps, setMyApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    electionId: preselectedElection || '',
    manifesto: '',
    partyName: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [elRes, appRes] = await Promise.all([
          API.get('/elections?status=upcoming'),
          API.get('/candidates/my-applications'),
        ]);
        setElections(elRes.data.data);
        setMyApps(appRes.data.data);

        // If preselected election is valid, keep it; otherwise clear
        if (preselectedElection) {
          const exists = elRes.data.data.find((e) => e._id === preselectedElection);
          if (exists) {
            setForm((prev) => ({ ...prev, electionId: preselectedElection }));
          }
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, [preselectedElection]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await API.post('/candidates/apply', form);
      toast.success('Application submitted! Awaiting admin approval.');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Application failed');
    } finally { setSubmitting(false); }
  };

  // Filter out elections user already applied to
  const alreadyAppliedIds = myApps.map((a) => a.electionId?._id || a.electionId);
  const availableElections = elections.filter((el) => !alreadyAppliedIds.includes(el._id));

  if (loading) return <><Navbar /><LoadingSpinner fullScreen /></>;

  return (
    <div className="min-h-screen bg-gradient-radial">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-text-primary mb-1">Apply as Candidate</h1>
          <p className="text-text-secondary mb-8">Submit your candidacy for an upcoming election</p>
        </motion.div>

        {/* Application Form */}
        {availableElections.length > 0 ? (
          <div className="glass rounded-2xl p-8 mb-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">Select Election</label>
                <select value={form.electionId} onChange={(e) => setForm({ ...form, electionId: e.target.value })}
                  className="input" required>
                  <option value="">Choose an election...</option>
                  {availableElections.map((el) => <option key={el._id} value={el._id}>{el.title}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">Party Name</label>
                <input type="text" value={form.partyName} onChange={(e) => setForm({ ...form, partyName: e.target.value })}
                  className="input" placeholder="Independent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">Manifesto</label>
                <textarea value={form.manifesto} onChange={(e) => setForm({ ...form, manifesto: e.target.value })}
                  className="input min-h-[120px] resize-none" placeholder="Your vision, goals, and promises..." required />
                <p className="text-xs text-text-muted mt-1">{form.manifesto.length}/5000 characters</p>
              </div>
              <button type="submit" disabled={submitting} className="btn btn-primary w-full h-12">
                {submitting ? <LoadingSpinner size="sm" /> : 'Submit Application'}
              </button>
            </form>
          </div>
        ) : elections.length > 0 ? (
          <div className="glass rounded-2xl p-8 mb-8 text-center">
            <div className="text-4xl mb-3">✅</div>
            <p className="text-text-primary font-semibold">You've applied to all upcoming elections!</p>
            <p className="text-sm text-text-muted mt-1">Check your applications below.</p>
          </div>
        ) : (
          <div className="glass rounded-2xl p-8 mb-8 text-center">
            <div className="text-4xl mb-3">📋</div>
            <p className="text-text-primary font-semibold">No upcoming elections available</p>
            <p className="text-sm text-text-muted mt-1">Check back later when new elections are created.</p>
          </div>
        )}

        {/* My Applications */}
        {myApps.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-text-primary mb-4">My Applications</h2>
            <div className="space-y-3">
              {myApps.map((app) => (
                <div key={app._id} className="card flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-text-primary">{app.electionId?.title || 'Election'}</h3>
                    <p className="text-xs text-text-muted">{app.partyName} • Applied {new Date(app.createdAt).toLocaleDateString()}</p>
                  </div>
                  <span className={`badge ${
                    app.status === 'approved' ? 'badge-success' :
                    app.status === 'rejected' ? 'badge-danger' : 'badge-warning'
                  }`}>{app.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default CandidateApply;

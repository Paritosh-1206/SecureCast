// pages/AdminDashboard.jsx — Admin panel with tabs for management
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import Navbar from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';
import {
  HiOutlineUserGroup, HiOutlineClipboardList, HiOutlineUserAdd,
  HiOutlinePlus, HiOutlineCheck, HiOutlineX,
  HiOutlinePlay, HiOutlineStop, HiOutlineEye, HiOutlineTrash,
  HiOutlineExternalLink,
} from 'react-icons/hi';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState('elections');
  const [stats, setStats] = useState({});
  const [elections, setElections] = useState([]);
  const [users, setUsers] = useState([]);
  const [pendingCandidates, setPendingCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newElection, setNewElection] = useState({
    title: '', description: '', startTime: '', endTime: '',
  });

  useEffect(() => {
    Promise.all([fetchStats(), fetchElections(), fetchUsers(), fetchPendingCandidates()])
      .finally(() => setLoading(false));
  }, []);

  const fetchStats = async () => {
    try {
      const res = await API.get('/admin/stats');
      setStats(res.data.data);
    } catch (e) { console.error(e); }
  };

  const fetchElections = async () => {
    try {
      const res = await API.get('/elections');
      setElections(res.data.data);
    } catch (e) { console.error(e); }
  };

  const fetchUsers = async () => {
    try {
      const res = await API.get('/admin/users');
      setUsers(res.data.data.users);
    } catch (e) { console.error(e); }
  };

  const fetchPendingCandidates = async () => {
    try {
      const res = await API.get('/candidates/pending');
      setPendingCandidates(res.data.data);
    } catch (e) { console.error(e); }
  };

  const createElection = async (e) => {
    e.preventDefault();
    try {
      await API.post('/elections', newElection);
      toast.success('Election created');
      setShowCreateModal(false);
      setNewElection({ title: '', description: '', startTime: '', endTime: '' });
      fetchElections();
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create election');
    }
  };

  const deployElection = async (id) => {
    try {
      await API.post(`/elections/${id}/deploy`);
      toast.success('Contract deployed and election started!');
      fetchElections();
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Deployment failed');
    }
  };

  const endElection = async (id) => {
    try {
      await API.post(`/elections/${id}/end`);
      toast.success('Election ended');
      fetchElections();
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to end election');
    }
  };

  const deleteElection = async (id) => {
    if (!window.confirm('Are you sure you want to delete this election? This cannot be undone.')) return;
    try {
      await API.delete(`/elections/${id}`);
      toast.success('Election deleted');
      fetchElections();
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete election');
    }
  };

  const publishResults = async (id) => {
    try {
      await API.post(`/elections/${id}/publish-results`);
      toast.success('Results published');
      fetchElections();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to publish results');
    }
  };

  const approveUser = async (id) => {
    try {
      await API.put(`/admin/users/${id}/approve`);
      toast.success('User approved');
      fetchUsers();
      fetchStats();
    } catch (err) {
      toast.error('Failed to approve user');
    }
  };

  const rejectUser = async (id) => {
    try {
      await API.put(`/admin/users/${id}/reject`);
      toast.success('User rejected');
      fetchUsers();
      fetchStats();
    } catch (err) {
      toast.error('Failed to reject user');
    }
  };

  const approveCandidate = async (id) => {
    try {
      await API.put(`/candidates/${id}/approve`);
      toast.success('Candidate approved');
      fetchPendingCandidates();
    } catch (err) {
      toast.error('Failed to approve candidate');
    }
  };

  const rejectCandidate = async (id) => {
    try {
      await API.put(`/candidates/${id}/reject`);
      toast.success('Candidate rejected');
      fetchPendingCandidates();
    } catch (err) {
      toast.error('Failed to reject candidate');
    }
  };

  const tabs = [
    { id: 'elections', label: 'Elections', icon: HiOutlineClipboardList, count: elections.length },
    { id: 'users', label: 'Users', icon: HiOutlineUserGroup, count: users.length },
    { id: 'candidates', label: 'Candidates', icon: HiOutlineUserAdd, count: pendingCandidates.length },
  ];

  if (loading) return <><Navbar /><LoadingSpinner fullScreen /></>;

  return (
    <div className="min-h-screen bg-gradient-radial">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Header with Stats */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Admin Dashboard</h1>
            <p className="text-text-secondary">Manage elections, users, and candidates</p>
          </div>
          <div className="flex gap-3">
            {[
              { label: 'Users', value: stats.totalUsers, color: 'text-primary-light' },
              { label: 'Elections', value: stats.totalElections, color: 'text-accent' },
              { label: 'Votes', value: stats.totalVotes, color: 'text-info' },
              { label: 'Pending', value: stats.pendingUsers, color: 'text-warning' },
            ].map((s) => (
              <div key={s.label} className="glass rounded-xl px-4 py-2 text-center min-w-[80px]">
                <p className={`text-xl font-bold ${s.color}`}>{s.value || 0}</p>
                <p className="text-[10px] text-text-muted uppercase">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-surface-light rounded-xl p-1 mb-6 w-fit">
          {tabs.map(({ id, label, icon: Icon, count }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition ${
                tab === id
                  ? 'bg-primary text-white shadow-lg shadow-primary/30'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              <Icon className="w-4 h-4" />{label}
              {id === 'candidates' && count > 0 && (
                <span className={`ml-1 w-5 h-5 rounded-full text-[10px] flex items-center justify-center ${
                  tab === id ? 'bg-white/20' : 'bg-warning/20 text-warning'
                }`}>{count}</span>
              )}
            </button>
          ))}
        </div>

        {/* Elections Tab */}
        {tab === 'elections' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">All Elections</h2>
              <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
                <HiOutlinePlus className="w-4 h-4" />Create Election
              </button>
            </div>

            <div className="space-y-3">
              {elections.map((el) => (
                <div key={el._id} className="card flex flex-wrap items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/elections/${el._id}`}
                      className="font-semibold text-text-primary truncate hover:text-primary-light transition inline-flex items-center gap-1.5 group"
                    >
                      {el.title}
                      <HiOutlineExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                    <p className="text-xs text-text-muted">
                      {new Date(el.startTime).toLocaleDateString()} — {new Date(el.endTime).toLocaleDateString()}
                      {' • '}{el.approvedCandidateCount || 0} candidates
                    </p>
                    {el.contractAddress && (
                      <p className="text-[10px] text-text-muted font-mono mt-0.5 truncate max-w-xs">
                        📜 {el.contractAddress}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`badge ${
                      el.status === 'active' ? 'badge-success' :
                      el.status === 'ended' ? 'badge-warning' : 'badge-info'
                    }`}>{el.status}</span>

                    {el.status === 'upcoming' && !el.contractAddress && (
                      <>
                        <button onClick={() => deployElection(el._id)} className="btn btn-accent text-xs py-1.5 px-3">
                          <HiOutlinePlay className="w-3.5 h-3.5" />Deploy & Start
                        </button>
                        <button onClick={() => deleteElection(el._id)} className="btn btn-ghost text-xs py-1.5 px-3 text-danger hover:bg-danger/10 hover:border-danger/30">
                          <HiOutlineTrash className="w-3.5 h-3.5" />Delete
                        </button>
                      </>
                    )}
                    {el.status === 'active' && (
                      <button onClick={() => endElection(el._id)} className="btn btn-danger text-xs py-1.5 px-3">
                        <HiOutlineStop className="w-3.5 h-3.5" />End
                      </button>
                    )}
                    {el.status === 'ended' && !el.isResultPublished && (
                      <button onClick={() => publishResults(el._id)} className="btn btn-primary text-xs py-1.5 px-3">
                        <HiOutlineEye className="w-3.5 h-3.5" />Publish Results
                      </button>
                    )}
                    {el.isResultPublished && <span className="badge badge-success">Published</span>}

                    <Link to={`/elections/${el._id}`} className="btn btn-ghost text-xs py-1.5 px-3">
                      <HiOutlineEye className="w-3.5 h-3.5" />View
                    </Link>
                  </div>
                </div>
              ))}

              {elections.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-4xl mb-3">📋</div>
                  <p className="text-text-muted">No elections yet</p>
                  <button onClick={() => setShowCreateModal(true)} className="btn btn-primary mt-4">
                    <HiOutlinePlus className="w-4 h-4" />Create Your First Election
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Users Tab */}
        {tab === 'users' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h2 className="text-lg font-semibold mb-4">All Users</h2>
            <div className="card p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-surface/50">
                      <th className="text-left p-4 text-text-muted font-medium">Name</th>
                      <th className="text-left p-4 text-text-muted font-medium">Email</th>
                      <th className="text-left p-4 text-text-muted font-medium">Role</th>
                      <th className="text-left p-4 text-text-muted font-medium">Status</th>
                      <th className="text-left p-4 text-text-muted font-medium">Face ID</th>
                      <th className="text-right p-4 text-text-muted font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {users.map((u) => (
                      <tr key={u._id} className="hover:bg-surface-light/50 transition-colors">
                        <td className="p-4 text-text-primary font-medium">{u.name}</td>
                        <td className="p-4 text-text-secondary">{u.email}</td>
                        <td className="p-4">
                          <span className={`badge text-[10px] ${
                            u.role === 'admin' ? 'badge-primary' :
                            u.role === 'candidate' ? 'badge-info' : 'badge-success'
                          }`}>{u.role}</span>
                        </td>
                        <td className="p-4">
                          <span className={`badge text-[10px] ${u.isApproved ? 'badge-success' : 'badge-warning'}`}>
                            {u.isApproved ? 'Approved' : 'Pending'}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`text-xs ${u.faceSetupComplete ? 'text-accent' : 'text-text-muted'}`}>
                            {u.faceSetupComplete ? '✓ Set up' : '✗ Missing'}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          {u.role !== 'admin' && (
                            <div className="flex items-center justify-end gap-2">
                              {!u.isApproved && (
                                <button onClick={() => approveUser(u._id)} className="btn btn-accent text-xs py-1 px-3">
                                  <HiOutlineCheck className="w-3.5 h-3.5" />Approve
                                </button>
                              )}
                              {u.isApproved && (
                                <button onClick={() => rejectUser(u._id)} className="btn btn-ghost text-xs py-1 px-3 text-danger hover:bg-danger/10 hover:border-danger/30">
                                  <HiOutlineX className="w-3.5 h-3.5" />Revoke
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {users.length === 0 && (
                <div className="text-center py-12 text-text-muted">No users registered yet</div>
              )}
            </div>
          </motion.div>
        )}

        {/* Candidates Tab */}
        {tab === 'candidates' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h2 className="text-lg font-semibold mb-4">Pending Candidate Applications</h2>
            <div className="space-y-3">
              {pendingCandidates.map((c) => (
                <div key={c._id} className="card">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold text-white">
                            {(c.userId?.name || 'U').charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-text-primary">{c.userId?.name}</h3>
                          <p className="text-xs text-text-muted">{c.userId?.email}</p>
                        </div>
                      </div>
                      <p className="text-xs text-primary-light mt-2">
                        Election: <span className="font-medium">{c.electionId?.title}</span> • Party: <span className="font-medium">{c.partyName}</span>
                      </p>
                      <p className="text-sm text-text-secondary mt-2 line-clamp-2">{c.manifesto}</p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => approveCandidate(c._id)} className="btn btn-accent text-xs py-1.5 px-3">
                        <HiOutlineCheck className="w-3.5 h-3.5" />Approve
                      </button>
                      <button onClick={() => rejectCandidate(c._id)} className="btn btn-danger text-xs py-1.5 px-3">
                        <HiOutlineX className="w-3.5 h-3.5" />Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {pendingCandidates.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-4xl mb-3">👥</div>
                  <p className="text-text-muted">No pending applications</p>
                  <p className="text-xs text-text-muted mt-1">Candidate applications will appear here for review.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Create Election Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="glass rounded-2xl p-8 w-full max-w-md"
            >
              <h2 className="text-xl font-bold text-text-primary mb-6">Create Election</h2>
              <form onSubmit={createElection} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Title</label>
                  <input
                    type="text"
                    value={newElection.title}
                    onChange={(e) => setNewElection({ ...newElection, title: e.target.value })}
                    className="input"
                    placeholder="Student Council Election 2026"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Description</label>
                  <textarea
                    value={newElection.description}
                    onChange={(e) => setNewElection({ ...newElection, description: e.target.value })}
                    className="input min-h-[80px] resize-none"
                    placeholder="Brief description of the election..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Start</label>
                    <input
                      type="datetime-local"
                      value={newElection.startTime}
                      onChange={(e) => setNewElection({ ...newElection, startTime: e.target.value })}
                      className="input"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">End</label>
                    <input
                      type="datetime-local"
                      value={newElection.endTime}
                      onChange={(e) => setNewElection({ ...newElection, endTime: e.target.value })}
                      className="input"
                      required
                    />
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-ghost flex-1">
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary flex-1">
                    Create
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;

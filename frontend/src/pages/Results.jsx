// pages/Results.jsx — Election results with Recharts visualization
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import API from '../api/axios';
import Navbar from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'];

const Results = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await API.get(`/elections/${id}/results`);
        setData(res.data.data);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to load results');
      } finally { setLoading(false); }
    };
    load();
  }, [id]);

  if (loading) return <><Navbar /><LoadingSpinner fullScreen /></>;
  if (!data) return <><Navbar /><div className="text-center py-20 text-text-secondary">Results not available</div></>;

  const chartData = data.results.map((r, i) => ({
    name: r.name,
    votes: r.votes,
    party: r.partyName,
    fill: COLORS[i % COLORS.length],
  }));

  const winner = data.results[0];

  return (
    <div className="min-h-screen bg-gradient-radial">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-text-primary mb-1">{data.election.title}</h1>
          <p className="text-text-secondary mb-2">Election Results — {data.totalVotes} total votes</p>
          {data.contractAddress && (
            <p className="text-xs text-text-muted font-mono mb-6">Contract: {data.contractAddress}</p>
          )}
        </motion.div>

        {/* Winner */}
        {winner && winner.votes > 0 && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/30 text-center">
            <div className="text-4xl mb-2">🏆</div>
            <h2 className="text-xl font-bold text-text-primary">{winner.name}</h2>
            <p className="text-primary-light">{winner.partyName}</p>
            <p className="text-3xl font-bold text-accent mt-2">{winner.votes} votes</p>
          </motion.div>
        )}

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-2 mb-8">
          {/* Bar Chart */}
          <div className="card p-6">
            <h3 className="text-sm font-semibold text-text-secondary mb-4 uppercase tracking-wider">Vote Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={12} />
                <YAxis stroke="#94A3B8" fontSize={12} allowDecimals={false} />
                <Tooltip contentStyle={{ background: '#1E293B', border: '1px solid #334155', borderRadius: 12, color: '#F1F5F9' }} />
                <Bar dataKey="votes" radius={[8, 8, 0, 0]}>
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Pie Chart */}
          <div className="card p-6">
            <h3 className="text-sm font-semibold text-text-secondary mb-4 uppercase tracking-wider">Vote Share</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={chartData} dataKey="votes" nameKey="name" cx="50%" cy="50%" outerRadius={110} label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`} labelLine={false}>
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#1E293B', border: '1px solid #334155', borderRadius: 12, color: '#F1F5F9' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Results Table */}
        <div className="card p-6">
          <h3 className="text-sm font-semibold text-text-secondary mb-4 uppercase tracking-wider">Detailed Results</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left pb-3 text-text-muted">#</th>
                <th className="text-left pb-3 text-text-muted">Candidate</th>
                <th className="text-left pb-3 text-text-muted">Party</th>
                <th className="text-right pb-3 text-text-muted">Votes</th>
                <th className="text-right pb-3 text-text-muted">Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.results.map((r, i) => (
                <tr key={i} className={i === 0 && r.votes > 0 ? 'bg-accent/5' : ''}>
                  <td className="py-3 text-text-muted">{r.candidateNumber}</td>
                  <td className="py-3 font-medium text-text-primary flex items-center gap-2">
                    {i === 0 && r.votes > 0 && <span>🏆</span>}
                    {r.name}
                  </td>
                  <td className="py-3 text-text-secondary">{r.partyName}</td>
                  <td className="py-3 text-right font-bold text-text-primary">{r.votes}</td>
                  <td className="py-3 text-right text-text-secondary">
                    {data.totalVotes > 0 ? ((r.votes / data.totalVotes) * 100).toFixed(1) : 0}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
};

export default Results;

// App.jsx — Main application with routing
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import FaceSetup from './pages/FaceSetup';
import VoterDashboard from './pages/VoterDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ElectionDetail from './pages/ElectionDetail';
import VotingPage from './pages/VotingPage';
import Results from './pages/Results';
import CandidateApply from './pages/CandidateApply';

// Smart dashboard redirect based on role
const DashboardRedirect = () => {
  const { user } = useAuth();
  if (user?.role === 'admin') return <Navigate to="/admin" replace />;
  return <VoterDashboard />;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1E293B',
              color: '#F1F5F9',
              border: '1px solid #334155',
              borderRadius: '12px',
              fontSize: '14px',
            },
            success: { iconTheme: { primary: '#10B981', secondary: '#fff' } },
            error: { iconTheme: { primary: '#EF4444', secondary: '#fff' } },
          }}
        />
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected routes — any authenticated user */}
          <Route path="/dashboard" element={
            <ProtectedRoute><DashboardRedirect /></ProtectedRoute>
          } />
          <Route path="/face-setup" element={
            <ProtectedRoute><FaceSetup /></ProtectedRoute>
          } />
          <Route path="/elections/:id" element={
            <ProtectedRoute><ElectionDetail /></ProtectedRoute>
          } />
          <Route path="/vote/:id" element={
            <ProtectedRoute><VotingPage /></ProtectedRoute>
          } />
          <Route path="/results/:id" element={
            <ProtectedRoute><Results /></ProtectedRoute>
          } />
          <Route path="/candidate/apply" element={
            <ProtectedRoute><CandidateApply /></ProtectedRoute>
          } />

          {/* Admin routes */}
          <Route path="/admin" element={
            <ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>
          } />

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

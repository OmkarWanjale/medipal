import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/AuthContext.jsx';
import Landing from './pages/Landing.jsx';
import AuthPage from './pages/AuthPage.jsx';
import ChatPage from './pages/ChatPage.jsx';
import DoctorDashboard from './pages/DoctorDashboard.jsx';

function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', fontSize: '14px' }}>Loading...</div>;
  if (!user) return <Navigate to="/" replace />;
  if (role && user.role !== role) return <Navigate to={user.role === 'doctor' ? '/doctor' : '/chat'} replace />;
  return children;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/chat" element={
            <ProtectedRoute role="patient"><ChatPage /></ProtectedRoute>
          } />
          <Route path="/doctor" element={
            <ProtectedRoute role="doctor"><DoctorDashboard /></ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

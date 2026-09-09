import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AppLayout from './components/layout/AppLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ApplyLeave from './pages/ApplyLeave';
import MyRequests from './pages/MyRequests';
import RequestDetail from './pages/RequestDetail';
import Approvals from './pages/Approvals';
import MyTeam from './pages/MyTeam';
import TeamCalendar from './pages/TeamCalendar';
import HolidayCalendar from './pages/HolidayCalendar';
import Delegation from './pages/Delegation';
import Administration from './pages/Administration';

function Protected({ children, roles }) {
  const { user, loading, hasRole } = useAuth();
  if (loading) return <FullScreenLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !hasRole(...roles)) return <Navigate to="/" replace />;
  return children;
}

function FullScreenLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 rounded-full border-2 border-aurora-violet/30 border-t-aurora-violet animate-spin" />
    </div>
  );
}

function Shell() {
  const { user, loading } = useAuth();
  if (loading) return <FullScreenLoader />;
  if (!user) return <Navigate to="/login" replace />;
  return <AppLayout />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<Shell />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/apply" element={<ApplyLeave />} />
            <Route path="/my-requests" element={<MyRequests />} />
            <Route path="/my-requests/:requestId" element={<RequestDetail />} />
            <Route path="/team-calendar" element={<TeamCalendar />} />
            <Route path="/holidays" element={<HolidayCalendar />} />
            <Route path="/approvals" element={<Protected roles={['MANAGER', 'HR_ADMIN']}><Approvals /></Protected>} />
            <Route path="/my-team" element={<Protected roles={['MANAGER', 'HR_ADMIN']}><MyTeam /></Protected>} />
            <Route path="/delegation" element={<Protected roles={['MANAGER']}><Delegation /></Protected>} />
            <Route path="/administration" element={<Protected roles={['HR_ADMIN']}><Administration /></Protected>} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

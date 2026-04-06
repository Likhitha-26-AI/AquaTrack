import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import VillagesPage from './pages/VillagesPage';
import TankersPage from './pages/TankersPage';
import DeliveriesPage from './pages/DeliveriesPage';
import ComplaintsPage from './pages/ComplaintsPage';
import TrackingPage from './pages/TrackingPage';

const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
};

const Layout = ({ children }) => (
  <div className="app-layout">
    <Sidebar />
    <main className="main-content">{children}</main>
  </div>
);

const AppRoutes = () => {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <LoginPage />} />
      <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <RegisterPage />} />
      <Route path="/dashboard" element={
        <ProtectedRoute><Layout><DashboardPage /></Layout></ProtectedRoute>
      } />
      <Route path="/villages" element={
        <ProtectedRoute roles={['Admin', 'VillageLeader']}><Layout><VillagesPage /></Layout></ProtectedRoute>
      } />
      <Route path="/tankers" element={
        <ProtectedRoute roles={['Admin', 'Driver']}><Layout><TankersPage /></Layout></ProtectedRoute>
      } />
      <Route path="/deliveries" element={
        <ProtectedRoute><Layout><DeliveriesPage /></Layout></ProtectedRoute>
      } />
      <Route path="/complaints" element={
        <ProtectedRoute><Layout><ComplaintsPage /></Layout></ProtectedRoute>
      } />
      <Route path="/tracking" element={
        <ProtectedRoute><Layout><TrackingPage /></Layout></ProtectedRoute>
      } />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

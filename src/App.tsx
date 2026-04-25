import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import AdminDashboard from './pages/admin/Dashboard';
import MemberSchedule from './pages/member/Schedule';
import MemberReservations from './pages/member/MyReservations';
import MemberProfile from './pages/member/Profile';
import ProtectedRoute from './components/layout/ProtectedRoute';
import { AuthProvider } from './hooks/useAuth';
import { ToastProvider } from './components/ui/Toast';
import { BrandingProvider } from './contexts/BrandingContext';

function App() {
  return (
    <AuthProvider>
      <BrandingProvider>
        <ToastProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />

              {/* Admin Routes */}
              <Route path="/admin" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />

              {/* Member Routes */}
              <Route path="/" element={<ProtectedRoute role="member"><MemberSchedule /></ProtectedRoute>} />
              <Route path="/my-reservations" element={<ProtectedRoute role="member"><MemberReservations /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute role="member"><MemberProfile /></ProtectedRoute>} />
            </Routes>
          </Router>
        </ToastProvider>
      </BrandingProvider>
    </AuthProvider>
  );
}

export default App;

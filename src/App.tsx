import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import AdminDashboard from './pages/admin/Dashboard';
import MemberSchedule from './pages/member/Schedule';
import MemberReservations from './pages/member/MyReservations';
import ProtectedRoute from './components/layout/ProtectedRoute';
import { AuthProvider } from './hooks/useAuth';
import { ToastProvider } from './components/ui/Toast';

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Admin Routes */}
            <Route path="/admin" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />

            {/* Member Routes */}
            <Route path="/" element={<ProtectedRoute role="member"><MemberSchedule /></ProtectedRoute>} />
            <Route path="/my-reservations" element={<ProtectedRoute role="member"><MemberReservations /></ProtectedRoute>} />
          </Routes>
        </Router>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;

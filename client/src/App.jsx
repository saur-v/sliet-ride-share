// client/src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext.jsx';
import { SocketProvider } from './contexts/SocketContext.jsx';

// Pages
import Landing      from './pages/Landing.jsx';
import Login        from './pages/Login.jsx';
import Register     from './pages/Register.jsx';
import Verify       from './pages/Verify.jsx';
import Dashboard    from './pages/Dashboard.jsx';
import BrowseGroups from './pages/BrowseGroups.jsx';
import CreateGroup  from './pages/CreateGroup.jsx';
import GroupDetails from './pages/GroupDetails.jsx';
import Profile      from './pages/Profile.jsx';
import MyGroups     from './pages/MyGroups.jsx';
import Admin        from './pages/Admin.jsx';

// Components
import ProtectedRoute from './components/ProtectedRoute.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <Routes>
            {/* Public */}
            <Route path="/"         element={<Landing />} />
            <Route path="/login"    element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify"   element={<Verify />} />

            {/* Auth required */}
            <Route path="/dashboard" element={
              <ProtectedRoute><Dashboard /></ProtectedRoute>
            } />
            <Route path="/browse" element={
              <ProtectedRoute><BrowseGroups /></ProtectedRoute>
            } />
            <Route path="/groups/:id" element={
              <ProtectedRoute><GroupDetails /></ProtectedRoute>
            } />
            <Route path="/my-groups" element={
              <ProtectedRoute><MyGroups /></ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute><Profile /></ProtectedRoute>
            } />

            {/* Auth + profile required */}
            <Route path="/create" element={
              <ProtectedRoute requireProfile><CreateGroup /></ProtectedRoute>
            } />

            {/* Admin only */}
            <Route path="/admin" element={
              <ProtectedRoute requireAdmin><Admin /></ProtectedRoute>
            } />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

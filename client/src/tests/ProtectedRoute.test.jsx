// client/src/tests/ProtectedRoute.test.jsx
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute.jsx';
import { AuthContext } from '../contexts/AuthContext.jsx';

// Helper: render with a fake auth context
const renderWithAuth = (user, loading = false, path = '/protected') => {
  const fakeAuth = { user, loading, login: jest.fn(), logout: jest.fn(), refreshUser: jest.fn() };
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthContext.Provider value={fakeAuth}>
        <Routes>
          <Route path="/login"     element={<div>Login Page</div>} />
          <Route path="/verify"    element={<div>Verify Page</div>} />
          <Route path="/profile"   element={<div>Profile Page</div>} />
          <Route path="/protected" element={
            <ProtectedRoute>
              <div>Protected Content</div>
            </ProtectedRoute>
          } />
          <Route path="/profile-required" element={
            <ProtectedRoute requireProfile>
              <div>Profile Required Content</div>
            </ProtectedRoute>
          } />
        </Routes>
      </AuthContext.Provider>
    </MemoryRouter>
  );
};

describe('ProtectedRoute', () => {
  it('shows loading spinner while auth is loading', () => {
    renderWithAuth(null, true);
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('redirects to /login when not authenticated', () => {
    renderWithAuth(null, false);
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  it('redirects to /verify when email not verified', () => {
    renderWithAuth({ emailVerified: false, contactNo: '911', hostelNo: 'H1', collegeId: 'B1' }, false);
    expect(screen.getByText('Verify Page')).toBeInTheDocument();
  });

  it('renders children for verified user', () => {
    renderWithAuth({ emailVerified: true, contactNo: '911', hostelNo: 'H1', collegeId: 'B1' }, false);
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('redirects to /profile when requireProfile and profile incomplete', () => {
    render(
      <MemoryRouter initialEntries={['/profile-required']}>
        <AuthContext.Provider value={{ user: { emailVerified: true, contactNo: '', hostelNo: '', collegeId: '' }, loading: false }}>
          <Routes>
            <Route path="/profile" element={<div>Profile Page</div>} />
            <Route path="/profile-required" element={
              <ProtectedRoute requireProfile>
                <div>Profile Required Content</div>
              </ProtectedRoute>
            } />
          </Routes>
        </AuthContext.Provider>
      </MemoryRouter>
    );
    expect(screen.getByText('Profile Page')).toBeInTheDocument();
  });
});

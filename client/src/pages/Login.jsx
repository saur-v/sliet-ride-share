// client/src/pages/Login.jsx
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  const [serverError, setServerError] = useState('');
  const { register, handleSubmit, formState: { isSubmitting } } = useForm();

  const onSubmit = async (data) => {
    setServerError('');
    try {
      await login(data);
      navigate(from, { replace: true });
    } catch (err) {
      setServerError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="card max-w-md w-full">
        <h1 className="text-2xl font-bold mb-1">Sign in</h1>
        <p className="text-gray-500 text-sm mb-6">SLIET RideShare</p>

        {serverError && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">{serverError}</div>}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input {...register('email')} type="email" className="input-field" placeholder="you@sliet.ac.in" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input {...register('password')} type="password" className="input-field" placeholder="••••••••" />
          </div>
          <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-4">
          No account? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  );
}

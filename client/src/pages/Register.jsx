import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../services/api.js';

const domain = import.meta.env.VITE_COLLEGE_DOMAIN || 'sliet.ac.in';

const schema = yup.object({
  name:     yup.string().min(2).max(100).required('Name is required'),
  email:    yup.string().email().matches(new RegExp(`@${domain}$`), `Must be a @${domain} email`).required(),
  password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
});

export default function Register() {
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data) => {
    setServerError('');
    try {
      await authApi.register(data);
      setSent(true);
    } catch (err) {
      setServerError(err.response?.data?.message || 'Registration failed');
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="card max-w-md w-full text-center">
          <div className="text-5xl mb-4">📧</div>
          <h2 className="text-2xl font-bold mb-2">Check your email!</h2>
          <p className="text-gray-600">We sent a verification link to your college email. Click it to complete registration.</p>
          <p className="text-sm text-gray-400 mt-4">Didn't get it? Check your spam folder or <button onClick={() => setSent(false)} className="text-blue-600 underline">try again</button>.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="card max-w-md w-full">
        <h1 className="text-2xl font-bold mb-1">Create account</h1>
        <p className="text-gray-500 text-sm mb-6">Use your <strong>@{domain}</strong> email</p>
        {serverError && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">{serverError}</div>}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Full Name</label>
            <input {...register('name')} className="input-field" placeholder="Your name" />
            {errors.name && <p className="error-text">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">College Email</label>
            <input {...register('email')} type="email" className="input-field" placeholder={`you@${domain}`} />
            {errors.email && <p className="error-text">{errors.email.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input {...register('password')} type="password" className="input-field" placeholder="Min 6 characters" />
            {errors.password && <p className="error-text">{errors.password.message}</p>}
          </div>
          <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
            {isSubmitting ? 'Sending...' : 'Create Account'}
          </button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-4">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

// client/src/pages/Verify.jsx
import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { authApi } from '../services/api.js';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function Verify() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { loginWithTokens } = useAuth();
  const [status, setStatus] = useState('verifying'); // verifying | success | error
  const [message, setMessage] = useState('');

  useEffect(() => {
    const email = params.get('email');
    const token = params.get('token');
    if (!email || !token) { setStatus('error'); setMessage('Invalid verification link.'); return; }

    authApi.verifyEmail({ email, token })
      .then(({ data }) => {
        loginWithTokens(data.accessToken, data.refreshToken, data.user);
        setStatus('success');
        setTimeout(() => navigate('/profile?incomplete=true'), 2000);
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Verification failed.');
      });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="card max-w-md w-full text-center">
        {status === 'verifying' && <><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div><p>Verifying your email...</p></>}
        {status === 'success'   && <><div className="text-5xl mb-4">✅</div><h2 className="text-xl font-bold">Email verified!</h2><p className="text-gray-500 mt-2">Redirecting to your profile...</p></>}
        {status === 'error'     && <><div className="text-5xl mb-4">❌</div><h2 className="text-xl font-bold">Verification failed</h2><p className="text-gray-500 mt-2">{message}</p><a href="/register" className="btn-primary inline-block mt-4">Try again</a></>}
      </div>
    </div>
  );
}

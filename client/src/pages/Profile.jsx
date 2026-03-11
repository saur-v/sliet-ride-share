// client/src/pages/Profile.jsx
import { useForm } from 'react-hook-form';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { userApi } from '../services/api.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import Navbar from '../components/Navbar.jsx';

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const [searchParams] = useSearchParams();
  const incomplete = searchParams.get('incomplete') === 'true';
  const [saved, setSaved] = useState(false);
  const [serverError, setServerError] = useState('');

  const { register, handleSubmit, reset, formState: { isSubmitting, isDirty } } = useForm();

  useEffect(() => {
    if (user) reset({ name: user.name, contactNo: user.contactNo || '', hostelNo: user.hostelNo || '', collegeId: user.collegeId || '' });
  }, [user]);

  const onSubmit = async (data) => {
    setServerError(''); setSaved(false);
    try {
      await userApi.updateMe(data);
      await refreshUser();
      setSaved(true);
    } catch (err) { setServerError(err.response?.data?.message || 'Update failed'); }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-lg mx-auto px-4 py-8">
        {incomplete && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-4 mb-6">
            <p className="font-semibold">Complete your profile to join rides</p>
            <p className="text-sm mt-1">Fill in all fields below to unlock join and create features.</p>
          </div>
        )}
        <h1 className="text-2xl font-bold mb-6">Your Profile</h1>
        {serverError && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">{serverError}</div>}
        {saved && <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-3 mb-4 text-sm">✅ Profile updated!</div>}

        <form onSubmit={handleSubmit(onSubmit)} className="card space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Full Name</label>
            <input {...register('name')} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input value={user?.email || ''} disabled className="input-field bg-gray-50 text-gray-500" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Roll Number / College ID <span className="text-red-500">*</span></label>
            <input {...register('collegeId')} className="input-field" placeholder="e.g. BE21001" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Contact Number <span className="text-red-500">*</span></label>
            <input {...register('contactNo')} type="tel" className="input-field" placeholder="10-digit mobile number" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Hostel / Block <span className="text-red-500">*</span></label>
            <input {...register('hostelNo')} className="input-field" placeholder="e.g. H-1, G-2, Day Scholar" />
          </div>
          <button type="submit" disabled={isSubmitting || !isDirty} className="btn-primary w-full">
            {isSubmitting ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </div>
    </div>
  );
}

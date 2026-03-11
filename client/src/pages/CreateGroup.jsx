// client/src/pages/CreateGroup.jsx
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { groupApi } from '../services/api.js';
import Navbar from '../components/Navbar.jsx';

const schema = yup.object({
  title:       yup.string().min(3).max(120).required('Title required'),
  origin:      yup.string().required('Origin required'),
  destination: yup.string().required('Destination required'),
  date:        yup.string().required('Date required'),
  time:        yup.string().matches(/^\d{2}:\d{2}$/, 'Time must be HH:MM').required(),
  seatsTotal:  yup.number().min(1).max(10).required('Seats required'),
  meetingPoint:yup.string().max(200),
  description: yup.string().max(500),
  seatPrice:   yup.number().min(0).optional(),
});

export default function CreateGroup() {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { seatsTotal: 4, seatPrice: 0 },
  });

  const onSubmit = async (data) => {
    setServerError('');
    try {
      const { data: group } = await groupApi.create(data);
      navigate(`/groups/${group._id}`);
    } catch (err) {
      setServerError(err.response?.data?.message || 'Failed to create group');
    }
  };

  const Field = ({ name, label, type = 'text', placeholder, ...rest }) => (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <input {...register(name)} type={type} className="input-field" placeholder={placeholder} {...rest} />
      {errors[name] && <p className="error-text">{errors[name].message}</p>}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Create a Ride Group</h1>
        {serverError && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">{serverError}</div>}

        <form onSubmit={handleSubmit(onSubmit)} className="card space-y-4">
          <Field name="title" label="Title" placeholder="e.g. Sangrur 9pm — 4 seats" />
          <div className="grid grid-cols-2 gap-4">
            <Field name="origin" label="From" placeholder="SLIET Main Gate" />
            <Field name="destination" label="To" placeholder="Sangrur Bus Stand" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field name="date" label="Date" type="date" />
            <Field name="time" label="Time (HH:MM)" placeholder="21:00" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field name="seatsTotal" label="Total Seats" type="number" />
            <Field name="seatPrice" label="Seat Price (₹, optional)" type="number" />
          </div>
          <Field name="meetingPoint" label="Meeting Point (optional)" placeholder="Near Gate #2" />
          <div>
            <label className="block text-sm font-medium mb-1">Description (optional)</label>
            <textarea {...register('description')} rows={3} className="input-field" placeholder="Any details about the ride..." />
            {errors.description && <p className="error-text">{errors.description.message}</p>}
          </div>
          <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
            {isSubmitting ? 'Creating...' : 'Create Ride Group'}
          </button>
        </form>
      </div>
    </div>
  );
}

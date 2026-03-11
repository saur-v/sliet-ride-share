// client/src/pages/Dashboard.jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { groupApi } from '../services/api.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import GroupCard from '../components/GroupCard.jsx';
import Navbar from '../components/Navbar.jsx';

export default function Dashboard() {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    groupApi.list({ limit: 6 })
      .then(({ data }) => setGroups(data.groups))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const profileIncomplete = !user?.contactNo || !user?.hostelNo || !user?.collegeId;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        {profileIncomplete && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-center justify-between">
            <div>
              <p className="font-semibold text-amber-800">Complete your profile</p>
              <p className="text-sm text-amber-600">Add your contact number, hostel, and roll number to join or create rides.</p>
            </div>
            <Link to="/profile" className="btn-primary text-sm whitespace-nowrap ml-4">Complete now</Link>
          </div>
        )}

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Hello, {user?.name?.split(' ')[0]} 👋</h1>
          {!profileIncomplete && (
            <Link to="/create" className="btn-primary">+ New Ride</Link>
          )}
        </div>

        <h2 className="text-lg font-semibold mb-4">Upcoming rides</h2>
        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading...</div>
        ) : groups.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-500 mb-4">No rides available yet.</p>
            <Link to="/create" className="btn-primary">Create the first one</Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {groups.map((g) => <GroupCard key={g._id} group={g} />)}
          </div>
        )}
        <div className="text-center mt-6">
          <Link to="/browse" className="text-blue-600 hover:underline">View all rides →</Link>
        </div>
      </div>
    </div>
  );
}

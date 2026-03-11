// client/src/pages/MyGroups.jsx
import { useEffect, useState } from 'react';
import { groupApi } from '../services/api.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import GroupCard from '../components/GroupCard.jsx';
import Navbar from '../components/Navbar.jsx';
import { Link } from 'react-router-dom';

export default function MyGroups() {
  const { user } = useAuth();
  const [created, setCreated]  = useState([]);
  const [joined,  setJoined]   = useState([]);
  const [loading, setLoading]  = useState(true);

  useEffect(() => {
    // Fetch groups where user is creator and where user is member (not creator)
    Promise.all([
      groupApi.list({ creatorId: user._id }),          // backend would need this filter; simplified here
      groupApi.list({ memberId: user._id }),
    ])
      .then(([c, j]) => {
        setCreated(c.data.groups);
        setJoined(j.data.groups.filter(g => g.creatorId?._id !== user._id && g.creatorId !== user._id));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">My Rides</h1>
          <Link to="/create" className="btn-primary">+ New Ride</Link>
        </div>

        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Rides I Created</h2>
          {created.length === 0 ? (
            <p className="text-gray-500">You haven't created any rides yet.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">{created.map(g => <GroupCard key={g._id} group={g} />)}</div>
          )}
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-4">Rides I Joined</h2>
          {joined.length === 0 ? (
            <p className="text-gray-500">You haven't joined any rides yet. <Link to="/browse">Browse rides →</Link></p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">{joined.map(g => <GroupCard key={g._id} group={g} />)}</div>
          )}
        </section>
      </div>
    </div>
  );
}

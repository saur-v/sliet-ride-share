// client/src/pages/Admin.jsx
import { useEffect, useState } from 'react';
import { adminApi } from '../services/api.js';
import Navbar from '../components/Navbar.jsx';

export default function Admin() {
  const [stats, setStats]   = useState(null);
  const [users, setUsers]   = useState([]);
  const [logs,  setLogs]    = useState([]);
  const [tab,   setTab]     = useState('overview');
  const [search, setSearch] = useState('');

  useEffect(() => {
    adminApi.stats().then(r => setStats(r.data));
    adminApi.auditLogs().then(r => setLogs(r.data.logs));
  }, []);

  useEffect(() => {
    adminApi.users({ q: search }).then(r => setUsers(r.data.users));
  }, [search]);

  const handleSuspend = async (id, suspended) => {
    await adminApi.suspendUser(id, { suspended: !suspended });
    setUsers(u => u.map(x => x._id === id ? { ...x, suspended: !suspended } : x));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

        <div className="flex gap-2 mb-6 border-b">
          {['overview','users','logs'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium capitalize border-b-2 -mb-px transition ${tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>
              {t}
            </button>
          ))}
        </div>

        {tab === 'overview' && stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Total Users',      value: stats.users },
              { label: 'Total Groups',     value: stats.groups },
              { label: 'Active (Open)',    value: stats.activeGroups },
              { label: 'Confirmed Rides',  value: stats.confirmedGroups },
            ].map(s => (
              <div key={s.label} className="card text-center">
                <p className="text-3xl font-bold text-blue-600">{s.value}</p>
                <p className="text-sm text-gray-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {tab === 'users' && (
          <div>
            <input value={search} onChange={e => setSearch(e.target.value)} className="input-field mb-4 max-w-sm" placeholder="Search users..." />
            <div className="space-y-2">
              {users.map(u => (
                <div key={u._id} className="card flex items-center justify-between">
                  <div>
                    <p className="font-medium">{u.name}</p>
                    <p className="text-sm text-gray-500">{u.email} · {u.role} · Hostel: {u.hostelNo || '—'}</p>
                  </div>
                  <div className="flex gap-2">
                    {u.suspended ? (
                      <button onClick={() => handleSuspend(u._id, u.suspended)} className="text-sm text-green-600 border border-green-300 px-3 py-1 rounded-lg hover:bg-green-50">Unsuspend</button>
                    ) : (
                      <button onClick={() => handleSuspend(u._id, u.suspended)} className="text-sm text-red-600 border border-red-300 px-3 py-1 rounded-lg hover:bg-red-50">Suspend</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'logs' && (
          <div className="space-y-2">
            {logs.map(l => (
              <div key={l._id} className="card text-sm">
                <span className="font-medium">{l.actorId?.name || 'Unknown'}</span> performed <span className="font-mono bg-gray-100 px-1 rounded">{l.action}</span> on {l.targetType} <span className="text-gray-500">{l.targetId}</span>
                <span className="float-right text-gray-400">{new Date(l.createdAt).toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

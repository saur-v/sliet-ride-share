// client/src/pages/BrowseGroups.jsx
import { useState, useEffect, useCallback } from 'react';
import { groupApi } from '../services/api.js';
import GroupCard from '../components/GroupCard.jsx';
import Navbar from '../components/Navbar.jsx';

export default function BrowseGroups() {
  const [groups, setGroups] = useState([]);
  const [total, setTotal]   = useState(0);
  const [page, setPage]     = useState(1);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    date: '', origin: '', destination: '', seatsMin: '', status: '',
  });

  const fetchGroups = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 12, ...Object.fromEntries(Object.entries(filters).filter(([,v]) => v)) };
      const { data } = await groupApi.list(params);
      setGroups(data.groups);
      setTotal(data.total);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [filters, page]);

  useEffect(() => { fetchGroups(); }, [fetchGroups]);

  const handleFilter = (e) => {
    setFilters(f => ({ ...f, [e.target.name]: e.target.value }));
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Browse Rides</h1>

        {/* Filters */}
        <div className="card mb-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <input name="date"        type="date"   value={filters.date}        onChange={handleFilter} className="input-field text-sm" placeholder="Date" />
          <input name="origin"      type="text"   value={filters.origin}      onChange={handleFilter} className="input-field text-sm" placeholder="From" />
          <input name="destination" type="text"   value={filters.destination} onChange={handleFilter} className="input-field text-sm" placeholder="To" />
          <input name="seatsMin"    type="number" value={filters.seatsMin}    onChange={handleFilter} className="input-field text-sm" placeholder="Min seats" min="1" />
          <select name="status" value={filters.status} onChange={handleFilter} className="input-field text-sm">
            <option value="">All statuses</option>
            <option value="open">Open</option>
            <option value="confirmed">Confirmed</option>
          </select>
        </div>

        {loading ? (
          <div className="text-center py-16 text-gray-400">Loading rides...</div>
        ) : groups.length === 0 ? (
          <div className="card text-center py-16 text-gray-500">No rides match your filters.</div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-4">{total} ride{total !== 1 ? 's' : ''} found</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {groups.map((g) => <GroupCard key={g._id} group={g} />)}
            </div>
            {/* Pagination */}
            <div className="flex justify-center gap-2 mt-8">
              <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1} className="btn-secondary">← Prev</button>
              <span className="py-2 px-4 text-sm text-gray-600">Page {page}</span>
              <button onClick={() => setPage(p => p+1)} disabled={groups.length < 12} className="btn-secondary">Next →</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

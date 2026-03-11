// client/src/components/Navbar.jsx
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useEffect, useState } from 'react';
import { notifApi } from '../services/api.js';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unread, setUnread]     = useState(0);
  const [showNotif, setShowNotif] = useState(false);
  const [notifs, setNotifs]     = useState([]);

  useEffect(() => {
    if (!user) return;
    notifApi.list({ limit: 10 })
      .then(({ data }) => { setUnread(data.unreadCount); setNotifs(data.notifications); })
      .catch(console.error);
  }, [user]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleNotifOpen = async () => {
    setShowNotif(s => !s);
    if (!showNotif && unread > 0) {
      await notifApi.markRead();
      setUnread(0);
    }
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/dashboard" className="text-lg font-bold text-blue-600 no-underline">🚗 RideShare</Link>

        <div className="flex items-center gap-2">
          <Link to="/browse"    className="text-sm text-gray-600 hover:text-blue-600 px-2 py-1 hidden sm:block">Browse</Link>
          <Link to="/my-groups" className="text-sm text-gray-600 hover:text-blue-600 px-2 py-1 hidden sm:block">My Rides</Link>
          {user?.role === 'admin' && <Link to="/admin" className="text-sm text-red-600 px-2 py-1 hidden sm:block">Admin</Link>}

          {/* Notification bell */}
          <div className="relative">
            <button onClick={handleNotifOpen} className="relative p-2 text-gray-500 hover:text-blue-600 rounded-lg hover:bg-gray-100">
              🔔
              {unread > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center leading-none">{unread}</span>
              )}
            </button>
            {showNotif && (
              <div className="absolute right-0 mt-1 w-80 bg-white rounded-xl shadow-lg border border-gray-100 z-50">
                <div className="p-3 border-b font-semibold text-sm">Notifications</div>
                <div className="max-h-64 overflow-y-auto">
                  {notifs.length === 0 ? (
                    <p className="text-gray-400 text-sm text-center py-6">No notifications</p>
                  ) : notifs.map(n => (
                    <div key={n._id} className={`px-4 py-3 text-sm border-b last:border-0 ${n.read ? '' : 'bg-blue-50'}`}>
                      <p className="text-gray-800">{n.payload?.groupTitle || n.type}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{new Date(n.createdAt).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Link to="/profile" className="text-sm font-medium text-gray-700 hover:text-blue-600 px-2 py-1 rounded-lg hover:bg-gray-100">
            {user?.name?.split(' ')[0]}
          </Link>
          <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-red-600 px-2 py-1">Sign out</button>
        </div>
      </div>
    </nav>
  );
}

// client/src/components/GroupCard.jsx
import { Link } from 'react-router-dom';
import { config } from '../config.js';

const statusBadge = {
  open:      'badge-open',
  confirmed: 'badge-confirmed',
  cancelled: 'badge-cancelled',
  completed: 'badge-completed',
};

export default function GroupCard({ group }) {
  const seatsLeft = group.seatsTotal - group.seatsTaken;
  const rideDate  = new Date(group.date);
  const now       = new Date();
  const hoursAway = (rideDate - now) / 36e5;
  const expiringSoon = hoursAway > 0 && hoursAway <= (parseInt(import.meta.env.VITE_EXPIRY_SOON_HOURS) || 2);

  return (
    <Link to={`/groups/${group._id}`} className="card block hover:shadow-md transition-shadow border-l-4 border-transparent hover:border-blue-500">
      <div className="flex items-start justify-between mb-2">
        <span className={statusBadge[group.status] || 'badge-open'}>{group.status}</span>
        {expiringSoon && <span className="text-xs text-orange-600 font-medium animate-pulse">⏰ Soon</span>}
      </div>
      <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">{group.title}</h3>
      <p className="text-sm text-gray-500 mb-3">
        {group.origin} → {group.destination}
      </p>
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500">
          {rideDate.toLocaleDateString()} at {group.time}
        </span>
        <span className={`font-semibold ${seatsLeft === 0 ? 'text-red-500' : 'text-green-600'}`}>
          {seatsLeft} seat{seatsLeft !== 1 ? 's' : ''} left
        </span>
      </div>
      {group.seatPrice > 0 && (
        <p className="text-xs text-gray-400 mt-1">₹{group.seatPrice}/seat</p>
      )}
    </Link>
  );
}

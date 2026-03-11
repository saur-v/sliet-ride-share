// client/src/components/MemberList.jsx
import { groupApi } from '../services/api.js';

export default function MemberList({ members, isMember, currentUserId, groupId, isCreator, onRefresh }) {
  const handleKick = async (userId) => {
    if (!confirm('Remove this member?')) return;
    try {
      await groupApi.kick(groupId, userId);
      onRefresh();
    } catch (err) {
      alert(err.response?.data?.message || 'Could not remove member');
    }
  };

  if (!members.length) return <p className="text-gray-400 text-sm">No members yet.</p>;

  return (
    <ul className="space-y-3">
      {members.map((m) => (
        <li key={m._id || m.id} className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {m.avatarUrl ? (
              <img src={m.avatarUrl} alt={m.name} className="w-9 h-9 rounded-full object-cover" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm">
                {m.name?.[0]?.toUpperCase()}
              </div>
            )}
            <div>
              <p className="font-medium text-sm">
                {m.name}
                {m.isCreator && <span className="ml-2 text-xs text-blue-600">creator</span>}
                {(m._id || m.id) === currentUserId && <span className="ml-2 text-xs text-gray-400">(you)</span>}
              </p>
              <p className="text-xs text-gray-500">{m.hostelNo || 'No hostel'}</p>
              {/* Contact visible only to members */}
              {isMember && m.contactNo && (
                <p className="text-xs text-gray-600">📞 {m.contactNo}</p>
              )}
              {!isMember && (
                <p className="text-xs text-gray-400">🔒 Join to see contact</p>
              )}
            </div>
          </div>
          {isCreator && !(m._id || m.id === currentUserId) && !m.isCreator && (
            <button onClick={() => handleKick(m._id || m.id)} className="text-xs text-red-500 hover:text-red-700">
              Remove
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}

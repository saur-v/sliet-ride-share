// client/src/pages/GroupDetails.jsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { groupApi } from '../services/api.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useSocket } from '../contexts/SocketContext.jsx';
import ChatBox from '../components/ChatBox.jsx';
import MemberList from '../components/MemberList.jsx';
import Navbar from '../components/Navbar.jsx';

export default function GroupDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const { subscribeToGroup, socket } = useSocket();
  const navigate = useNavigate();

  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [vehicleInfo, setVehicleInfo] = useState('');
  const [error, setError] = useState('');

  const fetchGroup = async () => {
    try {
      const { data } = await groupApi.get(id);
      setGroup(data);
    } catch { navigate('/browse'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchGroup(); }, [id]);

  useEffect(() => {
    if (group) subscribeToGroup(id);
  }, [group]);

  // Realtime updates
  useEffect(() => {
    if (!socket) return;
    const onUpdate       = ({ group: g }) => setGroup(g);
    const onMemberJoined = ({ data }) => setGroup(g => g ? ({ ...g, seatsTaken: g.seatsTotal - data.seatsRemaining, members: [...(g.members || []), data.user] }) : g);
    const onMemberLeft   = ({ data }) => setGroup(g => g ? ({ ...g, seatsTaken: Math.max(0, g.seatsTaken - 1), members: (g.members || []).filter(m => m.id !== data.userId) }) : g);
    const onConfirmed    = ({ vehicleInfo: vi, meetingPoint: mp }) => setGroup(g => g ? ({ ...g, status: 'confirmed', vehicleInfo: vi, meetingPoint: mp }) : g);

    socket.on('group:updated',      onUpdate);
    socket.on('group:member_joined',onMemberJoined);
    socket.on('group:member_left',  onMemberLeft);
    socket.on('group:confirmed',    onConfirmed);
    return () => {
      socket.off('group:updated',      onUpdate);
      socket.off('group:member_joined',onMemberJoined);
      socket.off('group:member_left',  onMemberLeft);
      socket.off('group:confirmed',    onConfirmed);
    };
  }, [socket]);

  const isCreator = group?.creatorId?._id === user?._id || group?.creatorId === user?._id;
  const isMember  = group?.viewerIsMember;
  const seatsLeft = group ? group.seatsTotal - group.seatsTaken : 0;

  const handleJoin = async () => {
    setJoining(true); setError('');
    try {
      await groupApi.join(id);
      await fetchGroup();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not join');
    } finally { setJoining(false); }
  };

  const handleLeave = async () => {
    if (!confirm('Leave this ride group?')) return;
    try { await groupApi.leave(id); await fetchGroup(); }
    catch (err) { setError(err.response?.data?.message || 'Could not leave'); }
  };

  const handleConfirm = async () => {
    try {
      await groupApi.confirm(id, { vehicleInfo, meetingPoint: group.meetingPoint });
      setShowConfirmModal(false);
      await fetchGroup();
    } catch (err) { setError(err.response?.data?.message || 'Could not confirm'); }
  };

  const handleCancel = async () => {
    if (!confirm('Cancel this group? All members will be notified.')) return;
    try { await groupApi.cancel(id); navigate('/my-groups'); }
    catch (err) { setError(err.response?.data?.message || 'Could not cancel'); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div></div>;
  if (!group) return null;

  const statusClass = { open: 'badge-open', confirmed: 'badge-confirmed', cancelled: 'badge-cancelled', completed: 'badge-completed' };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">{error}</div>}

        <div className="card mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <span className={statusClass[group.status]}>{group.status.toUpperCase()}</span>
              <h1 className="text-2xl font-bold mt-2">{group.title}</h1>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-blue-600">{seatsLeft}</p>
              <p className="text-xs text-gray-500">seats left</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm mb-4">
            <div><p className="text-gray-500">From</p><p className="font-medium">{group.origin}</p></div>
            <div><p className="text-gray-500">To</p><p className="font-medium">{group.destination}</p></div>
            <div><p className="text-gray-500">Date</p><p className="font-medium">{new Date(group.date).toLocaleDateString()}</p></div>
            <div><p className="text-gray-500">Time</p><p className="font-medium">{group.time}</p></div>
          </div>

          {group.meetingPoint && <p className="text-sm text-gray-600 mb-2">📍 <strong>Meet at:</strong> {group.meetingPoint}</p>}
          {group.vehicleInfo  && <p className="text-sm text-gray-600 mb-2">🚗 <strong>Vehicle:</strong> {group.vehicleInfo}</p>}
          {group.seatPrice > 0 && <p className="text-sm text-gray-600 mb-2">💰 <strong>Seat price:</strong> ₹{group.seatPrice}</p>}
          {group.description  && <p className="text-sm text-gray-500 mt-3">{group.description}</p>}

          <div className="flex flex-wrap gap-3 mt-6">
            {!isMember && group.status === 'open' && seatsLeft > 0 && (
              <button onClick={handleJoin} disabled={joining} className="btn-primary">
                {joining ? 'Joining...' : 'Join Ride'}
              </button>
            )}
            {isMember && !isCreator && (
              <button onClick={handleLeave} className="btn-secondary">Leave Group</button>
            )}
            {isCreator && group.status === 'open' && (
              <>
                <button onClick={() => setShowConfirmModal(true)} className="btn-primary">✅ Confirm Booking</button>
                <button onClick={handleCancel} className="btn-danger">Cancel Group</button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h2 className="font-bold text-lg mb-4">Members ({group.seatsTaken}/{group.seatsTotal})</h2>
            <MemberList members={group.members || []} isMember={isMember} currentUserId={user?._id} groupId={id} isCreator={isCreator} onRefresh={fetchGroup} />
          </div>

          {isMember && (
            <div className="card flex flex-col">
              <h2 className="font-bold text-lg mb-4">Group Chat</h2>
              <ChatBox groupId={id} />
            </div>
          )}
        </div>
      </div>

      {/* Confirm Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Confirm Booking</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Vehicle Info</label>
              <input value={vehicleInfo} onChange={e => setVehicleInfo(e.target.value)} className="input-field" placeholder="e.g. Maruti Alto WB-1234, driver: Ram" />
            </div>
            <div className="flex gap-3">
              <button onClick={handleConfirm} className="btn-primary flex-1">Confirm & Notify Members</button>
              <button onClick={() => setShowConfirmModal(false)} className="btn-secondary">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

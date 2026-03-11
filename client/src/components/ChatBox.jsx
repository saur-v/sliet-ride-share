// client/src/components/ChatBox.jsx
import { useEffect, useRef, useState } from 'react';
import { groupApi } from '../services/api.js';
import { useSocket } from '../contexts/SocketContext.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function ChatBox({ groupId }) {
  const { user } = useAuth();
  const { socket, sendChatMessage } = useSocket();
  const [messages, setMessages] = useState([]);
  const [text, setText]         = useState('');
  const bottomRef               = useRef(null);

  // Load history
  useEffect(() => {
    groupApi.getMessages(groupId, { limit: 50 })
      .then(({ data }) => setMessages(data.messages))
      .catch(console.error);
  }, [groupId]);

  // Listen for new messages
  useEffect(() => {
    if (!socket) return;
    const onMsg = ({ groupId: gid, message }) => {
      if (gid === groupId) setMessages(m => [...m, message]);
    };
    socket.on('chat:message', onMsg);
    return () => socket.off('chat:message', onMsg);
  }, [socket, groupId]);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    sendChatMessage(groupId, text.trim());
    setText('');
  };

  const formatTime = (d) => new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="flex flex-col h-80">
      <div className="flex-1 overflow-y-auto space-y-3 mb-3 pr-1">
        {messages.length === 0 && (
          <p className="text-gray-400 text-sm text-center pt-8">No messages yet. Say hello! 👋</p>
        )}
        {messages.map((msg) => {
          const isMe = (msg.userId?._id || msg.userId) === user?._id;
          return (
            <div key={msg.id || msg._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs rounded-2xl px-3 py-2 text-sm ${isMe ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-gray-100 text-gray-900 rounded-bl-sm'}`}>
                {!isMe && <p className="text-xs font-semibold mb-0.5 text-blue-600">{msg.user?.name || 'Unknown'}</p>}
                <p>{msg.text}</p>
                <p className={`text-xs mt-0.5 ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>{formatTime(msg.createdAt)}</p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="input-field flex-1 text-sm"
          placeholder="Type a message..."
          maxLength={1000}
        />
        <button type="submit" disabled={!text.trim()} className="btn-primary px-4 text-sm">Send</button>
      </form>
    </div>
  );
}

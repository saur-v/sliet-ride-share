// client/src/contexts/SocketContext.jsx
// Creates one Socket.IO connection per authenticated session.
// Provides subscribe/unsubscribe helpers and raw socket access.

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext.jsx';

const SocketContext = createContext(null);

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!user) {
      // Disconnect if user logs out
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setConnected(false);
      }
      return;
    }

    const token = localStorage.getItem('accessToken');
    const socket = io(SOCKET_URL, {
      auth: { token },
      // Polling fallback — if websocket fails, uses long-polling every ~30s
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socket.on('connect',    () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('error',      (err) => console.error('Socket error:', err));

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user]);

  const subscribeToGroup = (groupId) => {
    socketRef.current?.emit('subscribe:group', groupId);
  };

  const unsubscribeFromGroup = (groupId) => {
    socketRef.current?.emit('unsubscribe:group', groupId);
  };

  const sendChatMessage = (groupId, text) => {
    socketRef.current?.emit('chat:send', { groupId, text });
  };

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, connected, subscribeToGroup, unsubscribeFromGroup, sendChatMessage }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);

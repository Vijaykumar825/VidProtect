import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [processingVideos, setProcessingVideos] = useState({});
  const { user } = useAuth();

  // Initialize socket connection
  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setConnected(false);
      }
      return;
    }

    const newSocket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true
    });

    newSocket.on('connect', () => {
      console.log('Socket connected');
      setConnected(true);
      // Join user's room for targeted events
      newSocket.emit('join', user.id);
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      setConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setConnected(false);
    });

    // Processing events
    newSocket.on('processing:start', (data) => {
      console.log('Processing started:', data);
      setProcessingVideos(prev => ({
        ...prev,
        [data.videoId]: { progress: 0, stage: 'Starting...' }
      }));
    });

    newSocket.on('processing:progress', (data) => {
      console.log('Processing progress:', data);
      setProcessingVideos(prev => ({
        ...prev,
        [data.videoId]: { progress: data.progress, stage: data.stage }
      }));
    });

    newSocket.on('processing:complete', (data) => {
      console.log('Processing complete:', data);
      setProcessingVideos(prev => {
        const updated = { ...prev };
        delete updated[data.videoId];
        return updated;
      });
    });

    newSocket.on('processing:error', (data) => {
      console.error('Processing error:', data);
      setProcessingVideos(prev => {
        const updated = { ...prev };
        delete updated[data.videoId];
        return updated;
      });
    });

    newSocket.on('upload:progress', (data) => {
      console.log('Upload progress:', data);
    });

    setSocket(newSocket);

    return () => {
      if (user) {
        newSocket.emit('leave', user.id);
      }
      newSocket.disconnect();
    };
  }, [user]);

  // Get processing status for a video
  const getProcessingStatus = useCallback((videoId) => {
    return processingVideos[videoId] || null;
  }, [processingVideos]);

  // Check if video is processing
  const isProcessing = useCallback((videoId) => {
    return !!processingVideos[videoId];
  }, [processingVideos]);

  const value = {
    socket,
    connected,
    processingVideos,
    getProcessingStatus,
    isProcessing
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}

export default SocketContext;

import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const socket = io(SOCKET_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000
});

const activeRooms = new Set();

// Helper to join a specific socket room
export const joinRoom = (roomName) => {
  activeRooms.add(roomName);
  if (socket.connected) {
    socket.emit('join', roomName);
  } else {
    socket.once('connect', () => {
      socket.emit('join', roomName);
    });
  }
};

// Auto resubscribe on reconnect
socket.on('connect', () => {
  console.log('📡 Socket connected/reconnected. Re-joining registered rooms:', Array.from(activeRooms));
  activeRooms.forEach(roomName => {
    socket.emit('join', roomName);
  });
});

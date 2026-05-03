import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

  connect() {
    this.socket = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnection: true,
    });

    this.socket.on('connect', () => {
      console.log('Socket connected');
      this.emit('connection_change', true);
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
      this.emit('connection_change', false);
    });

    this.socket.on('block_mined', (data) => {
      this.emit('block_mined', data);
    });

    this.socket.on('transaction_added', (data) => {
      this.emit('transaction_added', data);
    });

    this.socket.on('mining_error', (data) => {
      this.emit('mining_error', data);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach((callback) => callback(data));
    }
  }

  subscribeToBlocks() {
    this.socket?.emit('subscribe_blocks');
  }

  subscribeToTransactions() {
    this.socket?.emit('subscribe_transactions');
  }
}

export const socketService = new SocketService();
export default socketService;
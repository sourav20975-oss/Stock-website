import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5000';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

  connect() {
    if (this.socket && this.socket.connected) return this.socket;

    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000
    });

    this.socket.on('connect', () => {
      console.log('[Socket] Connected to server feed:', this.socket.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
    });

    this.socket.on('stock:update', (data) => {
      if (this.listeners.has(`stock:${data.symbol}`)) {
        this.listeners.get(`stock:${data.symbol}`).forEach(cb => cb(data));
      }
      if (this.listeners.has('all_stocks')) {
        this.listeners.get('all_stocks').forEach(cb => cb(data));
      }
    });

    return this.socket;
  }

  subscribeStock(symbol, callback) {
    if (!this.socket) this.connect();
    const clean = symbol.toUpperCase();
    const eventKey = `stock:${clean}`;

    if (!this.listeners.has(eventKey)) {
      this.listeners.set(eventKey, new Set());
    }
    this.listeners.get(eventKey).add(callback);

    this.socket.emit('stock:subscribe', { symbol: clean });
  }

  unsubscribeStock(symbol, callback) {
    if (!this.socket) return;
    const clean = symbol.toUpperCase();
    const eventKey = `stock:${clean}`;

    if (this.listeners.has(eventKey)) {
      this.listeners.get(eventKey).delete(callback);
      if (this.listeners.get(eventKey).size === 0) {
        this.listeners.delete(eventKey);
        this.socket.emit('stock:unsubscribe', { symbol: clean });
      }
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.listeners.clear();
    }
  }
}

export const socketService = new SocketService();

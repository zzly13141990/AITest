import { io, Socket } from 'socket.io-client';
import {
  ClientMessage,
  ServerMessage,
  ClientMessageType,
  ServerMessageType,
} from '../types/battle';
import { BATTLE_CONFIG } from '../constants/battle';

type MessageHandler = (data: any) => void;
type ConnectionHandler = () => void;

// 检测是否在 Electron 环境中
const isElectron = () => {
  return typeof window !== 'undefined' && (window as any).electronAPI;
};

// 获取服务器地址
const getServerUrl = async (): Promise<string> => {
  if (isElectron()) {
    try {
      const url = await (window as any).electronAPI.getServerUrl();
      console.log('🌐 Using Electron server URL:', url);
      return url;
    } catch (error) {
      console.error('Failed to get server URL from Electron, using default');
    }
  }
  return BATTLE_CONFIG.SERVER_URL;
};

class BattleSocketService {
  private socket: Socket | null = null;
  private handlers: Map<ServerMessageType, Set<MessageHandler>> = new Map();
  private connectHandlers: Set<ConnectionHandler> = new Set();
  private disconnectHandlers: Set<ConnectionHandler> = new Set();
  private reconnectAttempts = 0;
  private initialized = false;

  constructor() {
    // 延迟初始化，等待页面加载
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.init());
    } else {
      this.init();
    }
  }

  private async init() {
    if (this.initialized) return;
    this.initialized = true;

    // 清理之前的连接
    this.disconnect();
    
    const serverUrl = await getServerUrl();
    console.log('🔌 Initializing socket connection to:', serverUrl);
    
    // 创建新连接 - 简化配置
    this.socket = io(serverUrl, {
      transports: ['polling', 'websocket'], // 优先使用polling
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    // 立即更新连接状态
    setTimeout(() => {
      if (this.socket && this.socket.connected) {
        console.log('🔍 Socket already connected!');
        this.connectHandlers.forEach(handler => handler());
      }
    }, 500);

    // 监听连接事件
    this.socket.on('connect', () => {
      console.log('✅ Connected to battle server, socket id:', this.socket?.id);
      this.reconnectAttempts = 0;
      this.connectHandlers.forEach(handler => handler());
    });

    this.socket.on('disconnect', (reason: string) => {
      console.log('❌ Disconnected from battle server, reason:', reason);
      this.disconnectHandlers.forEach(handler => handler());
    });

    this.socket.on('connect_error', (error: Error) => {
      console.error('⚠️ Connection error:', error.message);
      this.reconnectAttempts++;
    });

    this.socket.on('connect_timeout', () => {
      console.error('⏱️ Connection timeout');
    });

    // 监听服务器消息
    this.socket.on('message', (message: ServerMessage) => {
      console.log('📨 Received message:', message);
      this.handleMessage(message);
    });
  }

  private handleMessage(message: ServerMessage) {
    const handlers = this.handlers.get(message.type);
    if (handlers) {
      handlers.forEach((handler) => handler(message.data));
    }
  }

  /**
   * 发送消息到服务器
   */
  send(type: ClientMessageType, data?: any) {
    console.log('📤 BattleSocket.send - type:', type, 'data:', data, 'connected:', this.socket?.connected);
    if (this.socket && this.socket.connected) {
      const message: ClientMessage = { type, data };
      console.log('📤 Emitting message:', message);
      this.socket.emit('message', message);
    } else {
      console.warn('Socket not connected, cannot send message');
    }
  }

  /**
   * 监听服务器消息
   */
  on(type: ServerMessageType, handler: MessageHandler) {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    this.handlers.get(type)!.add(handler);
  }

  /**
   * 取消监听
   */
  off(type: ServerMessageType, handler: MessageHandler) {
    const handlers = this.handlers.get(type);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  /**
   * 取消所有监听
   */
  offAll() {
    this.handlers.clear();
  }

  /**
   * 断开连接
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * 重新连接
   */
  reconnect() {
    this.initialized = false;
    this.init();
  }

  /**
   * 检查连接状态
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * 监听连接事件
   */
  onConnect(handler: ConnectionHandler): void {
    this.connectHandlers.add(handler);
  }

  /**
   * 监听断开事件
   */
  onDisconnect(handler: ConnectionHandler): void {
    this.disconnectHandlers.add(handler);
  }

  /**
   * 移除连接监听
   */
  offConnect(handler: ConnectionHandler): void {
    this.connectHandlers.delete(handler);
  }

  /**
   * 移除断开监听
   */
  offDisconnect(handler: ConnectionHandler): void {
    this.disconnectHandlers.delete(handler);
  }
}

// 导出单例
export const battleSocket = new BattleSocketService();

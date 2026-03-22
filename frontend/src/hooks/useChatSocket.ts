'use client';

import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/auth.store';
import { useChatStore } from '@/store/chat.store';
import { Message } from '@/types';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

export function useChatSocket() {
  const socketRef = useRef<Socket | null>(null);
  const { isAuthenticated } = useAuthStore();
  const { addMessage, updateTypingStatus, updateReadStatus } = useChatStore();

  useEffect(() => {
    if (!isAuthenticated) return;

    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const socket = io(`${SOCKET_URL}/chat`, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socket.on('message:receive', (message: Message) => {
      addMessage(message);
    });

    socket.on('message:read', (data: { conversationId: string; readBy: string }) => {
      updateReadStatus(data.conversationId, data.readBy);
    });

    socket.on('typing:start', (data: { conversationId: string; userId: string }) => {
      updateTypingStatus(data.conversationId, data.userId, true);
    });

    socket.on('typing:stop', (data: { conversationId: string; userId: string }) => {
      updateTypingStatus(data.conversationId, data.userId, false);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, addMessage, updateTypingStatus, updateReadStatus]);

  const sendMessage = useCallback((conversationId: string, content: string) => {
    socketRef.current?.emit('message:send', { conversationId, content });
  }, []);

  const markRead = useCallback((conversationId: string) => {
    socketRef.current?.emit('message:read', { conversationId });
  }, []);

  const emitTyping = useCallback((conversationId: string, isTyping: boolean) => {
    socketRef.current?.emit(isTyping ? 'typing:start' : 'typing:stop', { conversationId });
  }, []);

  const joinConversation = useCallback((conversationId: string) => {
    socketRef.current?.emit('conversation:join', { conversationId });
  }, []);

  return { sendMessage, markRead, emitTyping, joinConversation, socket: socketRef.current };
}

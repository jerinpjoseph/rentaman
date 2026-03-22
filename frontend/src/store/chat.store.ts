'use client';

import { create } from 'zustand';
import api from '@/lib/api';
import { Conversation, Message } from '@/types';

interface ChatState {
  conversations: Conversation[];
  activeConversationId: string | null;
  messages: Record<string, Message[]>;
  totalUnreadCount: number;
  isLoadingConversations: boolean;
  isLoadingMessages: boolean;
  hasMoreMessages: Record<string, boolean>;
  typingUsers: Record<string, string[]>;

  fetchConversations: () => Promise<void>;
  fetchMessages: (conversationId: string, cursor?: string) => Promise<void>;
  setActiveConversation: (id: string | null) => void;
  addMessage: (message: Message) => void;
  markConversationRead: (conversationId: string) => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  setTotalUnreadCount: (count: number) => void;
  updateTypingStatus: (conversationId: string, userId: string, isTyping: boolean) => void;
  updateReadStatus: (conversationId: string, readBy: string) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  activeConversationId: null,
  messages: {},
  totalUnreadCount: 0,
  isLoadingConversations: false,
  isLoadingMessages: false,
  hasMoreMessages: {},
  typingUsers: {},

  fetchConversations: async () => {
    set({ isLoadingConversations: true });
    try {
      const { data } = await api.get('/chat/conversations', { params: { limit: 50 } });
      const result = data.data || data;
      set({ conversations: result.items || [] });
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      set({ isLoadingConversations: false });
    }
  },

  fetchMessages: async (conversationId: string, cursor?: string) => {
    set({ isLoadingMessages: true });
    try {
      const params: any = { limit: 50 };
      if (cursor) params.cursor = cursor;

      const { data } = await api.get(`/chat/conversations/${conversationId}/messages`, { params });
      const result = data.data || data;
      const newMessages: Message[] = result.items || [];

      set((state) => {
        const existing = cursor ? (state.messages[conversationId] || []) : [];
        // Prepend older messages when using cursor, otherwise replace
        const merged = cursor ? [...newMessages, ...existing] : newMessages;
        // Deduplicate by id
        const seen = new Set<string>();
        const deduped = merged.filter((m) => {
          if (seen.has(m.id)) return false;
          seen.add(m.id);
          return true;
        });

        return {
          messages: { ...state.messages, [conversationId]: deduped },
          hasMoreMessages: { ...state.hasMoreMessages, [conversationId]: result.hasMore },
        };
      });
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      set({ isLoadingMessages: false });
    }
  },

  setActiveConversation: (id) => set({ activeConversationId: id }),

  addMessage: (message: Message) => {
    set((state) => {
      const convId = message.conversationId;
      const existing = state.messages[convId] || [];
      // Deduplicate
      if (existing.some((m) => m.id === message.id)) return state;

      const updatedMessages = { ...state.messages, [convId]: [...existing, message] };

      // Update conversation's lastMessage and move to top
      const updatedConversations = state.conversations.map((conv) => {
        if (conv.id === convId) {
          return {
            ...conv,
            lastMessage: {
              content: message.content,
              createdAt: message.createdAt,
              senderId: message.senderId,
            },
            lastMessageAt: message.createdAt,
            unreadCount:
              state.activeConversationId === convId
                ? conv.unreadCount
                : conv.unreadCount + 1,
          };
        }
        return conv;
      });
      // Sort by lastMessageAt
      updatedConversations.sort((a, b) => {
        const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
        const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
        return bTime - aTime;
      });

      return { messages: updatedMessages, conversations: updatedConversations };
    });
  },

  markConversationRead: async (conversationId: string) => {
    try {
      await api.patch(`/chat/conversations/${conversationId}/read`);
      set((state) => ({
        conversations: state.conversations.map((conv) =>
          conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv,
        ),
      }));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  },

  fetchUnreadCount: async () => {
    try {
      const { data } = await api.get('/chat/unread-count');
      const result = data.data || data;
      set({ totalUnreadCount: result.count || 0 });
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  },

  setTotalUnreadCount: (count: number) => set({ totalUnreadCount: count }),

  updateTypingStatus: (conversationId: string, userId: string, isTyping: boolean) => {
    set((state) => {
      const current = state.typingUsers[conversationId] || [];
      const updated = isTyping
        ? current.includes(userId) ? current : [...current, userId]
        : current.filter((id) => id !== userId);
      return { typingUsers: { ...state.typingUsers, [conversationId]: updated } };
    });
  },

  updateReadStatus: (conversationId: string, readBy: string) => {
    set((state) => {
      const msgs = state.messages[conversationId];
      if (!msgs) return state;
      const updated = msgs.map((m) =>
        m.senderId !== readBy && !m.isRead
          ? { ...m, isRead: true, readAt: new Date().toISOString() }
          : m,
      );
      return { messages: { ...state.messages, [conversationId]: updated } };
    });
  },
}));

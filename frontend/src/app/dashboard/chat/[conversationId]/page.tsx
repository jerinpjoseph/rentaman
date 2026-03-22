'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useChatStore } from '@/store/chat.store';
import { useChatSocket } from '@/hooks/useChatSocket';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { MessageThread } from '@/components/chat/MessageThread';
import { ChatInput } from '@/components/chat/ChatInput';
import { User } from '@/types';
import api from '@/lib/api';
import { Loader2 } from 'lucide-react';

export default function ConversationPage() {
  const params = useParams();
  const conversationId = params.conversationId as string;
  const { sendMessage, markRead, emitTyping, joinConversation } = useChatSocket();
  const {
    setActiveConversation,
    markConversationRead,
    conversations,
    typingUsers,
  } = useChatStore();

  const [participant, setParticipant] = useState<Pick<User, 'id' | 'firstName' | 'lastName' | 'avatar'> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setActiveConversation(conversationId);
    joinConversation(conversationId);
    markRead(conversationId);
    markConversationRead(conversationId);

    // Get participant info from conversations list or fetch
    const conv = conversations.find((c) => c.id === conversationId);
    if (conv) {
      setParticipant(conv.otherParticipant);
      setLoading(false);
    } else {
      // Fetch conversation details via REST
      api.get(`/chat/conversations`).then(({ data }) => {
        const result = data.data || data;
        const found = (result.items || []).find((c: any) => c.id === conversationId);
        if (found) setParticipant(found.otherParticipant);
      }).finally(() => setLoading(false));
    }

    return () => {
      setActiveConversation(null);
    };
  }, [conversationId]);

  const handleSend = useCallback((content: string) => {
    sendMessage(conversationId, content);
  }, [conversationId, sendMessage]);

  const handleTyping = useCallback((isTyping: boolean) => {
    emitTyping(conversationId, isTyping);
  }, [conversationId, emitTyping]);

  const typingUserIds = typingUsers[conversationId] || [];
  const isOtherTyping = typingUserIds.length > 0;

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-text-muted" />
      </div>
    );
  }

  if (!participant) {
    return (
      <div className="flex-1 flex items-center justify-center text-text-muted">
        <p>Conversation not found</p>
      </div>
    );
  }

  return (
    <>
      <ChatHeader participant={participant} isTyping={isOtherTyping} />
      <MessageThread conversationId={conversationId} />
      <ChatInput onSend={handleSend} onTyping={handleTyping} />
    </>
  );
}

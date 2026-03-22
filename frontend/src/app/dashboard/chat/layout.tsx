'use client';

import { useEffect } from 'react';
import { ConversationList } from '@/components/chat/ConversationList';
import { useChatSocket } from '@/hooks/useChatSocket';
import { useChatStore } from '@/store/chat.store';
import { useParams } from 'next/navigation';

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const activeConversationId = params?.conversationId as string | undefined;

  // Initialize chat socket connection
  useChatSocket();

  const { fetchUnreadCount } = useChatStore();
  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  return (
    <div className="flex h-[calc(100vh-4rem)] lg:h-[calc(100vh-5rem)]">
      {/* Conversation list - hidden on mobile when viewing a thread */}
      <div
        className={`w-full lg:w-[350px] lg:border-r border-border bg-surface flex-shrink-0
          ${activeConversationId ? 'hidden lg:flex lg:flex-col' : 'flex flex-col'}`}
      >
        <ConversationList activeConversationId={activeConversationId} />
      </div>

      {/* Message thread area */}
      <div
        className={`flex-1 flex flex-col bg-surface
          ${activeConversationId ? 'flex' : 'hidden lg:flex'}`}
      >
        {children}
      </div>
    </div>
  );
}

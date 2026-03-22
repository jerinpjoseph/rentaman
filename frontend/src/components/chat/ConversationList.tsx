'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useChatStore } from '@/store/chat.store';
import { ConversationItem } from './ConversationItem';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { MessageSquare, Search } from 'lucide-react';

interface ConversationListProps {
  activeConversationId?: string;
}

export function ConversationList({ activeConversationId }: ConversationListProps) {
  const router = useRouter();
  const { conversations, isLoadingConversations, fetchConversations } = useChatStore();
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const filtered = search
    ? conversations.filter((c) => {
        const name = `${c.otherParticipant.firstName} ${c.otherParticipant.lastName}`.toLowerCase();
        return name.includes(search.toLowerCase());
      })
    : conversations;

  if (isLoadingConversations) {
    return (
      <div className="p-4 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-xl" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-3 w-40" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-border">
        <h2 className="text-lg font-bold text-text-primary mb-3">Messages</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations..."
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-border bg-surface-secondary
              text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2
              focus:ring-primary/20 focus:border-primary"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <EmptyState
            icon={<MessageSquare className="w-12 h-12" />}
            title={search ? 'No results' : 'No conversations yet'}
            description={search ? 'Try a different search term' : 'Start a conversation from a booking'}
          />
        ) : (
          filtered.map((conv) => (
            <ConversationItem
              key={conv.id}
              conversation={conv}
              isActive={conv.id === activeConversationId}
              onClick={() => router.push(`/dashboard/chat/${conv.id}`)}
            />
          ))
        )}
      </div>
    </div>
  );
}

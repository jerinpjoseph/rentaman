'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useChatStore } from '@/store/chat.store';
import { useAuthStore } from '@/store/auth.store';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { Loader2 } from 'lucide-react';

interface MessageThreadProps {
  conversationId: string;
}

export function MessageThread({ conversationId }: MessageThreadProps) {
  const { messages, hasMoreMessages, isLoadingMessages, fetchMessages, typingUsers } = useChatStore();
  const { user } = useAuthStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const prevScrollHeightRef = useRef(0);
  const isInitialLoadRef = useRef(true);

  const conversationMessages = messages[conversationId] || [];
  const hasMore = hasMoreMessages[conversationId] ?? true;
  const typingUserIds = typingUsers[conversationId] || [];
  const isOtherTyping = typingUserIds.length > 0;

  // Initial load
  useEffect(() => {
    isInitialLoadRef.current = true;
    fetchMessages(conversationId);
  }, [conversationId, fetchMessages]);

  // Scroll to bottom on initial load and new messages
  useEffect(() => {
    if (isInitialLoadRef.current && conversationMessages.length > 0) {
      bottomRef.current?.scrollIntoView();
      isInitialLoadRef.current = false;
      return;
    }

    // If a new message was added (not loading older), scroll to bottom
    if (!isLoadingMessages && containerRef.current) {
      const container = containerRef.current;
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
      if (isNearBottom) {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [conversationMessages.length, isLoadingMessages]);

  // Load older messages on scroll to top
  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container || isLoadingMessages || !hasMore) return;

    if (container.scrollTop < 50) {
      const oldestMessage = conversationMessages[0];
      if (oldestMessage) {
        prevScrollHeightRef.current = container.scrollHeight;
        fetchMessages(conversationId, oldestMessage.id).then(() => {
          // Restore scroll position after prepending
          requestAnimationFrame(() => {
            if (containerRef.current) {
              const newScrollHeight = containerRef.current.scrollHeight;
              containerRef.current.scrollTop = newScrollHeight - prevScrollHeightRef.current;
            }
          });
        });
      }
    }
  }, [conversationId, conversationMessages, isLoadingMessages, hasMore, fetchMessages]);

  // Group messages by date
  const groupedMessages: { date: string; messages: typeof conversationMessages }[] = [];
  let currentDate = '';
  for (const msg of conversationMessages) {
    const msgDate = new Date(msg.createdAt).toLocaleDateString();
    if (msgDate !== currentDate) {
      currentDate = msgDate;
      groupedMessages.push({ date: msgDate, messages: [msg] });
    } else {
      groupedMessages[groupedMessages.length - 1].messages.push(msg);
    }
  }

  const formatDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto px-4 py-3"
    >
      {isLoadingMessages && conversationMessages.length > 0 && (
        <div className="flex justify-center py-3">
          <Loader2 className="w-5 h-5 animate-spin text-text-muted" />
        </div>
      )}

      {groupedMessages.map((group) => (
        <div key={group.date}>
          <div className="flex justify-center my-3">
            <span className="text-[10px] text-text-muted bg-surface-secondary px-3 py-1 rounded-full">
              {formatDateLabel(group.date)}
            </span>
          </div>
          {group.messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isOwn={msg.senderId === user?.id}
            />
          ))}
        </div>
      ))}

      {isOtherTyping && <TypingIndicator />}

      <div ref={bottomRef} />
    </div>
  );
}

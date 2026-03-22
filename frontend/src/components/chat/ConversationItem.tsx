'use client';

import { Conversation } from '@/types';
import { Avatar } from '@/components/ui/Avatar';
import { useAuthStore } from '@/store/auth.store';

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
}

export function ConversationItem({ conversation, isActive, onClick }: ConversationItemProps) {
  const { user } = useAuthStore();
  const { otherParticipant, lastMessage, unreadCount } = conversation;
  const name = `${otherParticipant.firstName} ${otherParticipant.lastName}`;

  const timeLabel = lastMessage
    ? formatTime(lastMessage.createdAt)
    : formatTime(conversation.createdAt);

  const previewText = lastMessage
    ? lastMessage.senderId === user?.id
      ? `You: ${lastMessage.content}`
      : lastMessage.content
    : 'No messages yet';

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 transition-colors text-left
        hover:bg-surface-secondary ${isActive ? 'bg-surface-secondary' : ''}`}
    >
      <Avatar
        src={otherParticipant.avatar}
        alt={name}
        size="md"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-text-primary truncate">{name}</span>
          <span className="text-[10px] text-text-muted flex-shrink-0 ml-2">{timeLabel}</span>
        </div>
        <div className="flex items-center justify-between mt-0.5">
          <p className="text-xs text-text-muted truncate">{previewText}</p>
          {unreadCount > 0 && (
            <span className="flex-shrink-0 ml-2 min-w-[18px] h-[18px] rounded-full bg-primary
              text-white text-[10px] font-bold flex items-center justify-center px-1">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const oneDay = 24 * 60 * 60 * 1000;

  if (diff < oneDay && date.getDate() === now.getDate()) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  if (diff < 2 * oneDay) return 'Yesterday';
  if (diff < 7 * oneDay) {
    return date.toLocaleDateString([], { weekday: 'short' });
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

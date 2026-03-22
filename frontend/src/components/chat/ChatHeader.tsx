'use client';

import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Avatar } from '@/components/ui/Avatar';
import { User } from '@/types';

interface ChatHeaderProps {
  participant: Pick<User, 'id' | 'firstName' | 'lastName' | 'avatar'>;
  isTyping?: boolean;
}

export function ChatHeader({ participant, isTyping }: ChatHeaderProps) {
  const router = useRouter();
  const name = `${participant.firstName} ${participant.lastName}`;

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-surface">
      <button
        onClick={() => router.push('/dashboard/chat')}
        className="lg:hidden p-1 rounded-lg hover:bg-surface-secondary transition-colors"
      >
        <ArrowLeft className="w-5 h-5 text-text-primary" />
      </button>
      <Avatar
        src={participant.avatar}
        alt={name}
        size="md"
      />
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold text-text-primary truncate">{name}</h3>
        {isTyping && (
          <p className="text-xs text-primary">typing...</p>
        )}
      </div>
    </div>
  );
}

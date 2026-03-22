'use client';

import { Message } from '@/types';
import { Check, CheckCheck } from 'lucide-react';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
}

export function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  const time = new Date(message.createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-2`}>
      <div
        className={`max-w-[75%] px-4 py-2 rounded-2xl ${
          isOwn
            ? 'bg-primary text-white rounded-br-md'
            : 'bg-surface-secondary text-text-primary rounded-bl-md'
        }`}
      >
        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
          <span className={`text-[10px] ${isOwn ? 'text-white/70' : 'text-text-muted'}`}>
            {time}
          </span>
          {isOwn && (
            message.isRead ? (
              <CheckCheck className="w-3.5 h-3.5 text-white/70" />
            ) : (
              <Check className="w-3.5 h-3.5 text-white/70" />
            )
          )}
        </div>
      </div>
    </div>
  );
}

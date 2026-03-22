'use client';

import { MessageSquare } from 'lucide-react';

export default function ChatPage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-text-muted">
      <MessageSquare className="w-16 h-16 mb-4 opacity-30" />
      <p className="text-lg font-medium">Select a conversation</p>
      <p className="text-sm mt-1">Choose from your existing conversations on the left</p>
    </div>
  );
}

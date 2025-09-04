'use client';

import Image from 'next/image';
import { Bot, User, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Message } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from './ui/skeleton';
import { Separator } from './ui/separator';

interface ChatMessageProps {
  message: Message;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.sender === 'user';

  return (
    <div className={cn('flex items-start gap-3', isUser ? 'justify-end' : 'justify-start')}>
      {!isUser && (
        <Avatar className="h-8 w-8 bg-muted border border-border">
          <AvatarFallback>
            <Bot />
          </AvatarFallback>
        </Avatar>
      )}
      <div
        className={cn(
          'max-w-md rounded-lg p-3 space-y-2',
          isUser ? 'bg-primary text-primary-foreground' : 'bg-card border'
        )}
      >
        {message.image && (
          <Image
            src={message.image}
            alt="User attachment"
            width={300}
            height={200}
            className="rounded-md object-cover"
            data-ai-hint="user attachment"
          />
        )}
        {message.isProcessing ? (
           <div className="space-y-2">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        ) : (
          <p className="whitespace-pre-wrap">{message.text}</p>
        )}
        {!isUser && message.explanation && !message.isProcessing && (
          <div className="space-y-2 pt-2">
            <Separator />
            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <Sparkles className="h-4 w-4 flex-shrink-0 text-primary" />
              <p>{message.explanation}</p>
            </div>
          </div>
        )}
      </div>
      {isUser && (
        <Avatar className="h-8 w-8">
          <AvatarFallback>
            <User />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}

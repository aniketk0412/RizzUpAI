'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Bot, User, Sparkles, Copy, Check, Flame, Smile, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Message } from '@/types';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from './ui/skeleton';
import { Separator } from './ui/separator';

interface ChatMessageProps {
  message: Message;
}

const vibeConfig = [
  {
    icon: Smile,
    badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    borderClass: 'hover:border-emerald-500/50',
    copiedBorder: 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-500/5',
  },
  {
    icon: Zap,
    badgeClass: 'bg-primary/10 text-primary border-primary/20',
    borderClass: 'hover:border-primary/50',
    copiedBorder: 'border-primary ring-2 ring-primary/20 bg-primary/5',
  },
  {
    icon: Flame,
    badgeClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
    borderClass: 'hover:border-rose-500/50',
    copiedBorder: 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-500/5',
  },
];

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.sender === 'user';
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => {
      setCopiedIndex(null);
    }, 2000);
  };

  const hasOptions = !isUser && message.options && message.options.length > 0;

  return (
    <div className={cn('flex items-start gap-3', isUser ? 'justify-end' : 'justify-start w-full')}>
      {!isUser && (
        <Avatar className="h-8 w-8 bg-muted border border-border shrink-0 mt-1">
          <AvatarFallback className="bg-primary/10 text-primary font-bold">
            <Bot className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      )}

      {/* User Message */}
      {isUser && (
        <div className="max-w-md rounded-2xl rounded-tr-sm p-4 space-y-2 bg-primary text-primary-foreground shadow-sm">
          {message.image && (
            <Image
              src={message.image}
              alt="Attachment"
              width={300}
              height={200}
              className="rounded-xl object-cover border border-white/20"
              data-ai-hint="user attachment"
            />
          )}
          <p className="whitespace-pre-wrap leading-relaxed text-sm">{message.text}</p>
        </div>
      )}

      {/* AI Message - Processing Skeletons */}
      {!isUser && message.isProcessing && (
        <div className="w-full max-w-3xl space-y-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground animate-pulse mb-1">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span>Cooking up 3 personalized vibes...</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl border bg-card p-4 space-y-3">
                <Skeleton className="h-5 w-24 rounded-full" />
                <Skeleton className="h-14 w-full rounded-md" />
                <Skeleton className="h-3 w-4/5" />
                <div className="pt-2">
                  <Skeleton className="h-8 w-full rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Message - 3 Options Deck */}
      {hasOptions && !message.isProcessing && (
        <div className="w-full max-w-3xl space-y-3">
          {message.explanation && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
              <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
              <span>{message.explanation}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {message.options!.map((option, idx) => {
              const vibe = vibeConfig[idx % vibeConfig.length];
              const Icon = vibe.icon;
              const isCopied = copiedIndex === idx;

              return (
                <div
                  key={idx}
                  onClick={() => handleCopy(option.text, idx)}
                  className={cn(
                    'group cursor-pointer relative flex flex-col justify-between rounded-xl border bg-card p-4 transition-all duration-200 shadow-sm hover:shadow-md',
                    vibe.borderClass,
                    isCopied && vibe.copiedBorder
                  )}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className={cn('gap-1 py-0.5 text-[11px] font-medium', vibe.badgeClass)}>
                        <Icon className="h-3 w-3" />
                        {option.label}
                      </Badge>
                    </div>

                    <p className="text-sm font-medium leading-relaxed tracking-tight text-foreground select-text">
                      "{option.text}"
                    </p>

                    <p className="text-xs text-muted-foreground leading-normal italic">
                      💡 {option.vibeReason}
                    </p>
                  </div>

                  <div className="pt-4 mt-2 border-t">
                    <Button
                      type="button"
                      variant={isCopied ? 'default' : 'secondary'}
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopy(option.text, idx);
                      }}
                      className="h-8 w-full text-xs gap-1.5"
                    >
                      {isCopied ? (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          <span className="font-medium">Copied to Clipboard!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          Copy Reply
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Fallback for legacy messages without options */}
      {!isUser && !hasOptions && !message.isProcessing && (
        <div className="max-w-md rounded-2xl rounded-tl-sm p-4 space-y-2 bg-card border shadow-sm">
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.text}</p>
          {message.explanation && (
            <div className="space-y-2 pt-2">
              <Separator />
              <div className="flex items-start gap-2 text-xs text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5 flex-shrink-0 text-primary" />
                <p>{message.explanation}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {isUser && (
        <Avatar className="h-8 w-8 shrink-0 mt-1">
          <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
            <User className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}

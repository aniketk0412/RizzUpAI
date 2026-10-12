'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Message } from '@/types';
import { Skeleton } from './ui/skeleton';

interface ChatMessageProps {
  message: Message;
}

const vibeMeta = [
  {
    defaultLabel: 'Chill',
    dot: 'bg-emerald-400',
    activeRing: 'border-emerald-500/80 bg-emerald-500/[0.06]',
  },
  {
    defaultLabel: 'Smooth',
    dot: 'bg-primary',
    activeRing: 'border-primary/80 bg-primary/[0.06]',
  },
  {
    defaultLabel: 'Bold',
    dot: 'bg-amber-400',
    activeRing: 'border-amber-500/80 bg-amber-500/[0.06]',
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

  if (isUser) {
    return (
      <div className="flex flex-col items-end w-full gap-1">
        <span className="text-[11px] text-muted-foreground px-1">
          Their message
        </span>
        <div className="max-w-lg rounded-2xl rounded-tr-sm px-4 py-2.5 space-y-2 bg-secondary text-secondary-foreground border border-border/70">
          {message.image && (
            <Image
              src={message.image}
              alt="Screenshot context"
              width={280}
              height={200}
              className="rounded-xl object-cover border border-border"
            />
          )}
          {message.text && (
            <p className="whitespace-pre-wrap leading-snug text-sm font-medium">
              {message.text}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full gap-2.5">
      {/* Processing State */}
      {message.isProcessing && (
        <div className="flex flex-col gap-2.5 w-full">
          <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span>Writing 3 angles...</span>
          </div>
          <div className="flex flex-col gap-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-4 rounded-2xl border border-border/70 bg-card px-4 py-3.5"
              >
                <div className="flex items-center gap-3 flex-1">
                  <Skeleton className="h-6 w-16 rounded-lg shrink-0" />
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-4 w-4/5" />
                    <Skeleton className="h-3 w-2/5" />
                  </div>
                </div>
                <Skeleton className="h-8 w-16 rounded-xl shrink-0" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3-Reply Flex Stack */}
      {hasOptions && !message.isProcessing && (
        <div className="flex flex-col gap-2 w-full">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs text-muted-foreground">
              {message.explanation || 'Tap any line to copy'}
            </span>
            <span className="font-code text-[10px] text-muted-foreground/70">
              CLICK TO COPY
            </span>
          </div>

          <div className="flex flex-col gap-2">
            {message.options!.map((option, idx) => {
              const meta = vibeMeta[idx % vibeMeta.length];
              const isCopied = copiedIndex === idx;

              return (
                <div
                  key={idx}
                  onClick={() => handleCopy(option.text, idx)}
                  className={cn(
                    'group cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-border/75 bg-card/90 px-4 py-3.5 transition-all duration-150 hover:border-primary/60 hover:bg-card',
                    isCopied && meta.activeRing
                  )}
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <span className="inline-flex items-center gap-1.5 shrink-0 rounded-lg bg-secondary border border-border/60 px-2.5 py-1 text-xs font-medium text-foreground mt-0.5">
                      <span className={cn('h-1.5 w-1.5 rounded-full', meta.dot)} />
                      {option.label || meta.defaultLabel}
                    </span>

                    <div className="flex flex-col gap-1 min-w-0 flex-1">
                      <p className="text-[15px] font-medium leading-snug text-foreground select-text">
                        {option.text}
                      </p>
                      {option.vibeReason && (
                        <p className="text-xs text-muted-foreground">
                          {option.vibeReason}
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopy(option.text, idx);
                    }}
                    className={cn(
                      'shrink-0 self-end sm:self-center inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-all',
                      isCopied
                        ? 'bg-emerald-500 text-white'
                        : 'bg-secondary text-muted-foreground group-hover:text-foreground group-hover:bg-accent'
                    )}
                  >
                    {isCopied ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Fallback single message */}
      {!hasOptions && !message.isProcessing && (
        <div className="max-w-lg rounded-2xl rounded-tl-sm p-3.5 bg-card border border-border">
          <p className="whitespace-pre-wrap text-sm leading-snug">{message.text}</p>
        </div>
      )}
    </div>
  );
}

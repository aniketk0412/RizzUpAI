'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Flame, Sparkles, Copy, Check, Smile, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Message } from '@/types';
import { Button } from '@/components/ui/button';
import { Skeleton } from './ui/skeleton';

interface ChatMessageProps {
  message: Message;
}

const vibeStyles = [
  {
    num: '01',
    defaultTag: 'THE TEASE',
    icon: Smile,
    accentText: 'text-emerald-500',
    accentBg: 'bg-emerald-500/10 border-emerald-500/25 text-emerald-500',
    hoverBorder: 'hover:border-emerald-500/50',
    copiedRing: 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-500/[0.04]',
  },
  {
    num: '02',
    defaultTag: 'THE SWEET SPOT',
    icon: Zap,
    accentText: 'text-primary',
    accentBg: 'bg-primary/10 border-primary/30 text-primary',
    hoverBorder: 'hover:border-primary/60',
    copiedRing: 'border-primary ring-2 ring-primary/25 bg-primary/[0.05]',
  },
  {
    num: '03',
    defaultTag: 'HIGH VOLTAGE',
    icon: Flame,
    accentText: 'text-amber-500',
    accentBg: 'bg-amber-500/10 border-amber-500/25 text-amber-500',
    hoverBorder: 'hover:border-amber-500/50',
    copiedRing: 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-500/[0.04]',
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
      <div className="flex flex-col items-end w-full space-y-1.5">
        <span className="font-code text-[10px] uppercase tracking-widest text-muted-foreground px-1">
          Incoming Message / Context
        </span>
        <div className="max-w-lg rounded-2xl rounded-tr-sm px-4 py-3 space-y-2.5 bg-secondary text-secondary-foreground border border-border/80 shadow-sm">
          {message.image && (
            <Image
              src={message.image}
              alt="Screenshot context"
              width={320}
              height={220}
              className="rounded-xl object-cover border border-border"
            />
          )}
          {message.text && (
            <p className="whitespace-pre-wrap leading-relaxed text-sm font-medium">
              “{message.text}”
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-3">
      {/* AI Processing Skeletons */}
      {message.isProcessing && (
        <div className="w-full space-y-3">
          <div className="flex items-center gap-2 font-code text-xs uppercase tracking-wider text-primary animate-pulse">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Calibrating 3 angles...</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl border border-border/80 bg-card p-5 space-y-4">
                <div className="flex justify-between items-center">
                  <Skeleton className="h-5 w-28 rounded-full" />
                  <Skeleton className="h-4 w-8" />
                </div>
                <Skeleton className="h-16 w-full rounded-lg" />
                <Skeleton className="h-3 w-4/5" />
                <Skeleton className="h-9 w-full rounded-xl" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3-Card Wingman Deck */}
      {hasOptions && !message.isProcessing && (
        <div className="w-full space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
              <span>{message.explanation || 'Tap any card to copy directly to your clipboard.'}</span>
            </div>
            <span className="hidden sm:inline font-code text-[10px] uppercase tracking-widest text-muted-foreground">
              3 CALIBRATED ANGLES
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {message.options!.map((option, idx) => {
              const style = vibeStyles[idx % vibeStyles.length];
              const Icon = style.icon;
              const isCopied = copiedIndex === idx;

              return (
                <div
                  key={idx}
                  onClick={() => handleCopy(option.text, idx)}
                  className={cn(
                    'group cursor-pointer relative flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl',
                    style.hoverBorder,
                    isCopied && style.copiedRing
                  )}
                >
                  <div className="space-y-3.5">
                    <div className="flex items-center justify-between">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-code text-[10px] uppercase tracking-wider font-semibold',
                          style.accentBg
                        )}
                      >
                        <Icon className="h-3 w-3" />
                        {option.label || style.defaultTag}
                      </span>
                      <span className="font-code text-xs text-muted-foreground/60 font-medium">
                        {style.num}
                      </span>
                    </div>

                    <p className="text-[15px] font-medium leading-relaxed tracking-tight text-foreground select-text">
                      “{option.text}”
                    </p>

                    <p className="text-xs text-muted-foreground leading-relaxed border-l-2 border-border pl-2.5">
                      {option.vibeReason}
                    </p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-border/60">
                    <Button
                      type="button"
                      variant={isCopied ? 'default' : 'secondary'}
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopy(option.text, idx);
                      }}
                      className={cn(
                        'h-9 w-full rounded-xl font-code text-xs uppercase tracking-wider gap-1.5 transition-all',
                        isCopied && 'bg-emerald-600 hover:bg-emerald-600 text-white'
                      )}
                    >
                      {isCopied ? (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          <span>Copied to Clipboard</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>Copy Line</span>
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

      {/* Legacy fallback */}
      {!hasOptions && !message.isProcessing && (
        <div className="max-w-lg rounded-2xl rounded-tl-sm p-4 space-y-2 bg-card border border-border">
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.text}</p>
        </div>
      )}
    </div>
  );
}

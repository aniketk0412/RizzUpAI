'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Copy, Check, RotateCw, Pencil, Trash2, X, ArrowUpRight, Zap, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Message } from '@/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from './ui/skeleton';

interface ChatMessageProps {
  message: Message;
  relation?: string;
  onResend?: (text: string, image?: string) => void;
  onEdit?: (messageId: string, newText: string) => void;
  onDelete?: (messageId: string) => void;
  onReroll?: (messageId: string, spicier?: boolean) => void;
}

const vibeMeta = [
  {
    num: '01',
    defaultLabel: 'Chill',
    dot: 'bg-emerald-400',
    badgeBg: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/25',
    activeRing: 'border-emerald-500/80 bg-emerald-500/[0.06] shadow-emerald-500/10 shadow-lg',
  },
  {
    num: '02',
    defaultLabel: 'Smooth',
    dot: 'bg-primary',
    badgeBg: 'bg-primary/10 text-primary border-primary/25',
    activeRing: 'border-primary/80 bg-primary/[0.06] shadow-primary/10 shadow-lg',
  },
  {
    num: '03',
    defaultLabel: 'Bold',
    dot: 'bg-amber-400',
    badgeBg: 'bg-amber-500/10 text-amber-500 border-amber-500/25',
    activeRing: 'border-amber-500/80 bg-amber-500/[0.06] shadow-amber-500/10 shadow-lg',
  },
];

export default function ChatMessage({
  message,
  relation = 'Crush',
  onResend,
  onEdit,
  onDelete,
  onReroll,
}: ChatMessageProps) {
  const isUser = message.sender === 'user';
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.text);

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => {
      setCopiedIndex(null);
    }, 2200);
  };

  const handleSaveEdit = () => {
    if (editText.trim() && onEdit) {
      onEdit(message.id, editText.trim());
      setIsEditing(false);
    }
  };

  const hasOptions = !isUser && message.options && message.options.length > 0;

  // 1. Sent / Incoming Message (The Target Context Card)
  if (isUser) {
    return (
      <div className="group relative w-full rounded-2xl border border-border/80 bg-card/90 p-4 sm:p-5 shadow-sm smooth-interactive hover:border-primary/50 hover:shadow-md animate-reveal-up">
        {/* Top Meta Bar + Hover Actions (Resend, Edit, Delete) */}
        <div className="flex items-center justify-between gap-2 border-b border-border/50 pb-3 mb-3">
          <div className="flex items-center gap-2 text-xs font-medium text-foreground">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Incoming text · <span className="text-primary font-semibold">{relation}</span></span>
          </div>

          {/* Hover Action Toolbar: Resend, Edit, Delete */}
          <div className="flex items-center gap-1 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300">
            {onResend && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                title="Resend & regenerate 3 angles"
                onClick={() => onResend(message.text, message.image)}
                className="h-7 px-2 text-[11px] font-medium text-muted-foreground hover:text-foreground rounded-lg gap-1 smooth-interactive"
              >
                <RotateCw className="h-3 w-3" />
                <span>Resend</span>
              </Button>
            )}

            {onEdit && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                title="Edit message"
                onClick={() => {
                  setEditText(message.text);
                  setIsEditing(!isEditing);
                }}
                className="h-7 px-2 text-[11px] font-medium text-muted-foreground hover:text-foreground rounded-lg gap-1 smooth-interactive"
              >
                <Pencil className="h-3 w-3" />
                <span>Edit</span>
              </Button>
            )}

            {onDelete && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                title="Delete message"
                onClick={() => onDelete(message.id)}
                className="h-7 px-2 text-[11px] font-medium text-destructive/80 hover:text-destructive hover:bg-destructive/10 rounded-lg gap-1 smooth-interactive"
              >
                <Trash2 className="h-3 w-3" />
                <span>Delete</span>
              </Button>
            )}
          </div>
        </div>

        {/* Message Content or Inline Edit Mode */}
        {message.image && (
          <div className="mb-3">
            <Image
              src={message.image}
              alt="Screenshot context"
              width={340}
              height={220}
              className="rounded-xl object-cover border border-border max-h-56 w-auto"
            />
          </div>
        )}

        {isEditing ? (
          <div className="flex flex-col gap-2.5 pt-1">
            <Textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="w-full text-sm bg-background border-border/90 rounded-xl min-h-[60px]"
              placeholder="Edit what they sent..."
            />
            <div className="flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(false)}
                className="h-7 text-xs rounded-lg gap-1"
              >
                <X className="h-3 w-3" /> Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleSaveEdit}
                className="h-7 text-xs rounded-lg bg-primary text-primary-foreground gap-1"
              >
                <Check className="h-3 w-3" /> Save & Resend
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-base sm:text-lg font-medium leading-relaxed text-foreground select-text">
            “{message.text}”
          </p>
        )}
      </div>
    );
  }

  // 2. The 3-Option Reply Deck (Non-Chatbot Studio Layout)
  return (
    <div className="flex flex-col w-full gap-3 pt-1">
      {/* Processing Skeleton Deck */}
      {message.isProcessing && (
        <div className="flex flex-col gap-3 w-full animate-reveal-fade">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground px-1">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span>Calibrating 3 reply angles...</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                style={{ animationDelay: `${i * 120}ms` }}
                className="flex flex-col justify-between gap-4 rounded-2xl border border-border/70 bg-card p-4 sm:p-5 animate-reveal-up min-h-[160px]"
              >
                <div className="flex items-center justify-between">
                  <Skeleton className="h-5 w-20 rounded-md" />
                  <Skeleton className="h-4 w-6 rounded-md" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-4/5" />
                </div>
                <Skeleton className="h-8 w-full rounded-xl" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3-Card Reply Deck */}
      {hasOptions && !message.isProcessing && (
        <div className="flex flex-col gap-3 w-full animate-reveal-up">
          {/* 1. Subtext & Red Flag Decoder Card */}
          {message.subtextAnalysis && (
            <div className="relative overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/[0.08] via-card to-card p-3.5 sm:p-4 shadow-sm animate-reveal-up">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-border/50 mb-2">
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-primary/20 text-primary">
                    <Zap className="h-3 w-3 fill-primary" />
                  </span>
                  <span className="text-[11px] font-bold tracking-wider uppercase text-foreground">
                    Subtext Decoder
                  </span>
                  <span className="rounded-md border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                    {message.subtextAnalysis.dynamic}
                  </span>
                </div>
                {message.subtextAnalysis.powerBalance && (
                  <span className="font-code text-[10px] text-muted-foreground bg-muted/70 border border-border/60 px-2 py-0.5 rounded-md">
                    Framing: <strong className="text-foreground">{message.subtextAnalysis.powerBalance}</strong>
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-foreground/90 font-medium leading-relaxed">
                {message.subtextAnalysis.subtext}
              </p>
            </div>
          )}

          {/* 2. Deck Strategy Header + "Spicier 🔥" / "Re-Roll" Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">Wingman Strategy:</span>
              <span>{message.explanation || 'Pick the angle that matches your play.'}</span>
            </div>

            {onReroll && (
              <div className="flex items-center gap-1.5 shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  title="Generate 3 higher-voltage, bold lines"
                  onClick={() => onReroll(message.id, true)}
                  className="h-7 px-2.5 rounded-xl border-amber-500/35 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 hover:text-amber-400 font-semibold text-xs gap-1.5 smooth-interactive shadow-sm"
                >
                  <Flame className="h-3.5 w-3.5 fill-amber-500" />
                  <span>Make it Spicier 🔥</span>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  title="Generate 3 fresh angles"
                  onClick={() => onReroll(message.id, false)}
                  className="h-7 px-2 rounded-xl text-xs text-muted-foreground hover:text-foreground gap-1 smooth-interactive"
                >
                  <RotateCw className="h-3 w-3" />
                  <span className="hidden sm:inline">Re-roll</span>
                </Button>
              </div>
            )}
          </div>

          {/* 3 Interactive Cards (Chill / Smooth / Bold) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {message.options!.map((option, idx) => {
              const meta = vibeMeta[idx % vibeMeta.length];
              const isCopied = copiedIndex === idx;

              return (
                <div
                  key={idx}
                  style={{ animationDelay: `${120 + idx * 140}ms` }}
                  onClick={() => handleCopy(option.text, idx)}
                  className={cn(
                    'group cursor-pointer relative flex flex-col justify-between rounded-2xl border border-border/80 bg-card/95 p-4 sm:p-5 transition-all duration-300 hover:border-primary/70 hover:-translate-y-1 hover:shadow-xl animate-reveal-up',
                    isCopied && meta.activeRing
                  )}
                >
                  {/* Card Top: Number + Vibe Badge */}
                  <div className="flex items-center justify-between pb-3 border-b border-border/40">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider',
                        meta.badgeBg
                      )}
                    >
                      <span className={cn('h-1.5 w-1.5 rounded-full', meta.dot)} />
                      {option.label || meta.defaultLabel}
                    </span>
                    <span className="font-code text-xs text-muted-foreground/60 font-semibold">
                      {meta.num}
                    </span>
                  </div>

                  {/* Card Body: Ready-to-send Message Draft */}
                  <div className="py-4 flex-1">
                    <p className="text-[15px] sm:text-base font-medium leading-relaxed text-foreground select-text">
                      {option.text}
                    </p>
                  </div>

                  {/* Card Footer: Micro-Reason + Copy Button */}
                  <div className="pt-3 border-t border-border/40 flex flex-col gap-2.5">
                    {option.vibeReason && (
                      <p className="text-[11px] text-muted-foreground line-clamp-1">
                        {option.vibeReason}
                      </p>
                    )}

                    <Button
                      type="button"
                      variant={isCopied ? 'default' : 'secondary'}
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopy(option.text, idx);
                      }}
                      className={cn(
                        'h-8 w-full rounded-xl text-xs font-semibold gap-1.5 smooth-interactive',
                        isCopied
                          ? 'bg-emerald-600 hover:bg-emerald-600 text-white'
                          : 'bg-secondary text-foreground hover:bg-primary hover:text-primary-foreground'
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
                          <span>Copy This Line</span>
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

      {/* Legacy / Single Fallback */}
      {!hasOptions && !message.isProcessing && (
        <div className="rounded-2xl p-4 bg-card border border-border animate-reveal-up">
          <p className="whitespace-pre-wrap text-sm leading-snug">{message.text}</p>
        </div>
      )}
    </div>
  );
}

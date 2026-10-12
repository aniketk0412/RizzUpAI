'use client';

import { useState, useRef, useEffect, type ChangeEvent, type KeyboardEvent } from 'react';
import Image from 'next/image';
import { ImagePlus, Mic, ArrowUp, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useSpeechToText } from '@/hooks/use-speech-to-text';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  onSendMessage: (message: string, image?: string) => void;
  isSending: boolean;
}

export default function ChatInput({ onSendMessage, isSending }: ChatInputProps) {
  const [text, setText] = useState('');
  const [image, setImage] = useState<{ file: File; preview: string } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { isListening, toggleListening } = useSpeechToText({
    onTranscriptChange: (transcript: string) => setText(transcript),
    onStartListening: () => setText(''),
  });

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [text]);

  const handleSend = () => {
    if ((text.trim() || image) && !isSending) {
      onSendMessage(text.trim(), image?.preview);
      setText('');
      setImage(null);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage({ file, preview: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="shrink-0 w-full border-t border-border/70 bg-background/90 backdrop-blur-md px-4 py-3">
      <div className="max-w-3xl mx-auto">
        {image && (
          <div className="mb-2 inline-flex items-center gap-3 rounded-xl border border-border bg-card p-1.5 pr-3">
            <Image
              src={image.preview}
              alt="Screenshot preview"
              width={48}
              height={48}
              className="rounded-lg object-cover h-10 w-10 border border-border"
            />
            <div className="text-xs">
              <p className="font-medium text-foreground">Screenshot attached</p>
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 rounded-full hover:bg-destructive/15 hover:text-destructive"
              onClick={() => setImage(null)}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}

        <div
          className={cn(
            'relative flex items-end gap-1.5 rounded-2xl border border-border/85 bg-card p-1.5 shadow-md transition-all focus-within:border-primary/60',
            isListening && 'ring-2 ring-primary border-primary'
          )}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageChange}
            className="hidden"
            accept="image/*"
          />

          <Button
            type="button"
            size="icon"
            variant="ghost"
            title="Upload chat screenshot"
            onClick={() => fileInputRef.current?.click()}
            disabled={isSending}
            className="h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground shrink-0"
          >
            <ImagePlus className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            size="icon"
            variant="ghost"
            title="Voice input"
            onClick={toggleListening}
            disabled={isSending}
            className={cn(
              'h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground shrink-0 transition-colors',
              isListening && 'text-primary bg-primary/10'
            )}
          >
            <Mic className="h-4 w-4" />
          </Button>

          <Textarea
            ref={textareaRef}
            rows={1}
            placeholder={
              isListening
                ? 'Listening...'
                : 'Paste what they said or drop a screenshot...'
            }
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full resize-none border-0 bg-transparent py-2 px-1 text-sm focus-visible:ring-0 focus-visible:ring-offset-0 min-h-[36px]"
            disabled={isSending}
          />

          <Button
            type="button"
            onClick={handleSend}
            disabled={isSending || (!text.trim() && !image)}
            className="h-9 px-3.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs gap-1.5 shrink-0"
          >
            <span>{isSending ? 'Writing...' : 'Get Replies'}</span>
            <ArrowUp className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

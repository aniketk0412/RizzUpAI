'use client';

import { useState, useRef, useEffect, type ChangeEvent, type KeyboardEvent } from 'react';
import Image from 'next/image';
import { ImagePlus, Mic, Sparkles, X } from 'lucide-react';
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
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`;
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
    <div className="w-full border-t border-border/70 bg-background/90 backdrop-blur-md px-4 py-3.5">
      <div className="max-w-4xl mx-auto">
        {image && (
          <div className="mb-2.5 inline-flex items-center gap-3 rounded-xl border border-border bg-card p-2 pr-3">
            <Image
              src={image.preview}
              alt="Screenshot preview"
              width={56}
              height={56}
              className="rounded-lg object-cover h-12 w-12 border border-border"
            />
            <div className="text-xs">
              <p className="font-medium text-foreground">Screenshot attached</p>
              <p className="text-muted-foreground font-code text-[10px]">Ready for vision analysis</p>
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 rounded-full hover:bg-destructive/15 hover:text-destructive"
              onClick={() => setImage(null)}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}

        <div
          className={cn(
            'relative flex items-end gap-2 rounded-2xl border border-border/90 bg-card p-2 shadow-lg transition-all focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/15',
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
            className="h-10 w-10 rounded-xl text-muted-foreground hover:text-foreground shrink-0"
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
              'h-10 w-10 rounded-xl text-muted-foreground hover:text-foreground shrink-0 transition-colors',
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
                : 'Paste what they said, describe the situation, or drop a screenshot...'
            }
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full resize-none border-0 bg-transparent py-2.5 px-1 text-sm focus-visible:ring-0 focus-visible:ring-offset-0 min-h-[40px]"
            disabled={isSending}
          />

          <Button
            type="button"
            onClick={handleSend}
            disabled={isSending || (!text.trim() && !image)}
            className="h-10 px-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs gap-1.5 shrink-0 shadow-md shadow-primary/20"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>{isSending ? 'Cooking...' : 'Get 3 Replies'}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

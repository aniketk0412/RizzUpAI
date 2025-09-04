'use client';

import { useState, useRef, useEffect, type ChangeEvent, type KeyboardEvent } from 'react';
import Image from 'next/image';
import { Paperclip, Mic, SendHorizontal, X } from 'lucide-react';
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

  const handleTranscriptChange = (transcript: string) => {
    setText(transcript);
  };
  
  const handleSpeechStart = () => {
    setText('');
  };

  const { isListening, toggleListening } = useSpeechToText({ 
    onTranscriptChange: handleTranscriptChange,
    onStartListening: handleSpeechStart 
  });

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [text]);

  const handleSend = () => {
    if ((text.trim() || image) && !isSending) {
      onSendMessage(text, image?.preview);
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

  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="p-4 bg-background border-t">
      <div className="flex items-end gap-2">
        <Button size="icon" variant="ghost" onClick={() => fileInputRef.current?.click()} disabled={isSending}>
          <Paperclip />
        </Button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageChange}
          className="hidden"
          accept="image/*"
        />
        <Button
          size="icon"
          variant="ghost"
          onClick={toggleListening}
          className={cn(isListening ? 'text-primary' : '', 'transition-colors')}
          disabled={isSending}
        >
          <Mic />
        </Button>
        <div className={cn("relative flex-1 rounded-lg border bg-card shadow-sm transition-all", isListening && 'ring-2 ring-primary ring-offset-2 ring-offset-background')}>
          {image && (
            <div className="relative p-2">
              <Image src={image.preview} alt="Preview" width={80} height={80} className="rounded-md" data-ai-hint="image preview" />
              <Button
                size="icon"
                variant="ghost"
                className="absolute top-0 right-0 h-6 w-6 rounded-full bg-gray-900/50 text-white"
                onClick={() => setImage(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
          <Textarea
            ref={textareaRef}
            rows={1}
            placeholder={isListening ? "Listening..." : "Type your message..."}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full resize-none border-0 bg-transparent pr-12 py-2 focus-visible:ring-0 focus-visible:ring-offset-0"
            disabled={isSending}
          />

          <div className="absolute right-1 bottom-1">
            <Button size="icon" onClick={handleSend} disabled={isSending || (!text.trim() && !image)} className="bg-primary text-primary-foreground rounded-full">
              <SendHorizontal />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

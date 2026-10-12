'use client';

import { useState, useEffect, useRef } from 'react';

interface SpeechToTextOptions {
  onTranscriptChange: (transcript: string) => void;
  onStartListening?: () => void;
}

// Support browser SpeechRecognition types
type SpeechRecognitionType = any;

export function useSpeechToText({ onTranscriptChange, onStartListening }: SpeechToTextOptions) {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionType | null>(null);
  const finalTranscriptRef = useRef('');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('Speech recognition not supported by this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscriptRef.current += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      onTranscriptChange(finalTranscriptRef.current + interimTranscript);
    };

    recognition.onerror = (event: any) => {
      // The 'aborted' error is thrown when the recognition is stopped manually.
      // We don't want to log this as an error.
      if (event.error !== 'aborted') {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      }
    };
    
    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
    };
  }, [onTranscriptChange]);

  const toggleListening = () => {
    if (recognitionRef.current) {
      if (isListening) {
        recognitionRef.current.stop();
        setIsListening(false);
      } else {
        finalTranscriptRef.current = '';
        if (onStartListening) {
          onStartListening();
        }
        recognitionRef.current.start();
        setIsListening(true);
      }
    }
  };

  return {
    isListening,
    toggleListening,
  };
}

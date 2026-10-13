export type Sender = 'user' | 'ai';
export type Relation = 'Crush' | 'GF' | 'BF' | 'Friend';
export type Tone = 'Friendly' | 'Flirty' | 'Rizz' | 'Romantic' | 'Ghosted';

export interface SubtextAnalysis {
  dynamic: string;
  subtext: string;
  powerBalance: 'Their court' | 'Balanced' | 'Your court';
}

export interface ReplyOption {
  label: string;
  text: string;
  vibeReason: string;
}

export interface Message {
  id: string;
  text: string;
  sender: Sender;
  image?: string; // data URI
  isProcessing?: boolean;
  explanation?: string;
  subtextAnalysis?: SubtextAnalysis;
  options?: ReplyOption[];
  selectedOptionIndex?: number;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  relation: Relation;
  tone: Tone;
  createdAt: number;
}

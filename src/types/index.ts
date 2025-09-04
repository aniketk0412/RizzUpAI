export type Sender = 'user' | 'ai';
export type Relation = 'GF' | 'BF' | 'Friend';
export type Tone = 'Friendly' | 'Flirty' | 'Rizz' | 'Romantic';

export interface Message {
  id: string;
  text: string;
  sender: Sender;
  image?: string; // data URI
  isProcessing?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  relation: Relation;
  tone: Tone;
  createdAt: number;
}

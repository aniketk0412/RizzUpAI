'use server';

import { eq, asc, desc, and } from 'drizzle-orm';
import { db, isDatabaseConfigured } from '@/db';
import { chatSessions, chatMessages } from '@/db/schema';
import { auth } from '@/auth';
import type { ChatSession, Message, Relation, Tone } from '@/types';

export async function fetchUserSessions(): Promise<ChatSession[] | null> {
  const session = await auth();
  if (!session?.user?.id || !isDatabaseConfigured()) {
    return null;
  }

  const dbSessions = await db
    .select()
    .from(chatSessions)
    .where(eq(chatSessions.userId, session.user.id))
    .orderBy(desc(chatSessions.createdAt));

  if (dbSessions.length === 0) {
    return [];
  }

  const results: ChatSession[] = [];
  for (const s of dbSessions) {
    const msgs = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.sessionId, s.id))
      .orderBy(asc(chatMessages.createdAt));

    results.push({
      id: s.id,
      title: s.title,
      relation: s.relation,
      tone: s.tone,
      createdAt: s.createdAt,
      messages: msgs.map((m) => ({
        id: m.id,
        sender: m.sender,
        text: m.text,
        image: m.image ?? undefined,
        explanation: m.explanation ?? undefined,
        options: m.options ?? undefined,
        selectedOptionIndex: m.selectedOptionIndex ?? undefined,
      })),
    });
  }

  return results;
}

export async function createDbChatSession(newSession: ChatSession) {
  const session = await auth();
  if (!session?.user?.id || !isDatabaseConfigured()) return;

  await db.insert(chatSessions).values({
    id: newSession.id,
    userId: session.user.id,
    title: newSession.title,
    relation: newSession.relation,
    tone: newSession.tone,
    createdAt: newSession.createdAt,
  });
}

export async function updateDbChatSession(
  sessionId: string,
  updates: { title?: string; relation?: Relation; tone?: Tone }
) {
  const session = await auth();
  if (!session?.user?.id || !isDatabaseConfigured()) return;

  await db
    .update(chatSessions)
    .set(updates)
    .where(
      and(
        eq(chatSessions.id, sessionId),
        eq(chatSessions.userId, session.user.id)
      )
    );
}

export async function deleteDbChatSession(sessionId: string) {
  const session = await auth();
  if (!session?.user?.id || !isDatabaseConfigured()) return;

  await db
    .delete(chatSessions)
    .where(
      and(
        eq(chatSessions.id, sessionId),
        eq(chatSessions.userId, session.user.id)
      )
    );
}

export async function saveDbChatMessage(sessionId: string, message: Message) {
  const session = await auth();
  if (!session?.user?.id || !isDatabaseConfigured()) return;

  await db.insert(chatMessages).values({
    id: message.id,
    sessionId,
    sender: message.sender,
    text: message.text,
    image: message.image ?? null,
    explanation: message.explanation ?? null,
    options: message.options ?? null,
    selectedOptionIndex: message.selectedOptionIndex ?? null,
    createdAt: Date.now(),
  });
}

export async function updateDbSelectedOption(
  messageId: string,
  selectedOptionIndex: number,
  text: string,
  explanation: string
) {
  const session = await auth();
  if (!session?.user?.id || !isDatabaseConfigured()) return;

  await db
    .update(chatMessages)
    .set({
      selectedOptionIndex,
      text,
      explanation,
    })
    .where(eq(chatMessages.id, messageId));
}

import {
  pgTable,
  text,
  integer,
  timestamp,
  primaryKey,
  jsonb,
  bigint,
} from 'drizzle-orm/pg-core';
import type { AdapterAccountType } from 'next-auth/adapters';
import type { ReplyOption, Relation, Tone, Sender } from '@/types';

export const users = pgTable('users', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text('name'),
  email: text('email').unique().notNull(),
  emailVerified: timestamp('email_verified', { mode: 'date' }),
  image: text('image'),
  passwordHash: text('password_hash'),
  credits: integer('credits').notNull().default(15),
  creditResetTimestamp: bigint('credit_reset_timestamp', { mode: 'number' }),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

export const accounts = pgTable(
  'accounts',
  {
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').$type<AdapterAccountType>().notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('provider_account_id').notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: text('token_type'),
    scope: text('scope'),
    id_token: text('id_token'),
    session_state: text('session_state'),
  },
  (account) => [
    primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  ]
);

export const sessions = pgTable('sessions', {
  sessionToken: text('session_token').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
});

export const verificationTokens = pgTable(
  'verification_tokens',
  {
    identifier: text('identifier').notNull(),
    token: text('token').notNull(),
    expires: timestamp('expires', { mode: 'date' }).notNull(),
  },
  (vt) => [
    primaryKey({
      columns: [vt.identifier, vt.token],
    }),
  ]
);

export const chatSessions = pgTable('chat_sessions', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull().default('New Chat'),
  relation: text('relation').$type<Relation>().notNull().default('Friend'),
  tone: text('tone').$type<Tone>().notNull().default('Friendly'),
  createdAt: bigint('created_at', { mode: 'number' })
    .notNull()
    .$defaultFn(() => Date.now()),
});

export const chatMessages = pgTable('chat_messages', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  sessionId: text('session_id')
    .notNull()
    .references(() => chatSessions.id, { onDelete: 'cascade' }),
  sender: text('sender').$type<Sender>().notNull(),
  text: text('text').notNull(),
  image: text('image'),
  explanation: text('explanation'),
  options: jsonb('options').$type<ReplyOption[]>(),
  selectedOptionIndex: integer('selected_option_index'),
  createdAt: bigint('created_at', { mode: 'number' })
    .notNull()
    .$defaultFn(() => Date.now()),
});

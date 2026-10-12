'use server';

import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { db, isDatabaseConfigured } from '@/db';
import { users } from '@/db/schema';
import { auth } from '@/auth';

export async function registerUser(email: string, password: string) {
  if (!isDatabaseConfigured()) {
    throw new Error(
      'DATABASE_URL is not configured yet. Please add your Neon Postgres URL to .env.local and run `npm run db:push`.'
    );
  }

  const normalizedEmail = email.toLowerCase().trim();
  if (!normalizedEmail || password.length < 6) {
    throw new Error('Please provide a valid email and a password of at least 6 characters.');
  }

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1);

  if (existing.length > 0) {
    throw new Error('An account with this email already exists.');
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await db.insert(users).values({
    email: normalizedEmail,
    name: normalizedEmail.split('@')[0],
    passwordHash,
    credits: 15,
    creditResetTimestamp: null,
  });

  return { success: true };
}

export async function getUserProfile() {
  const session = await auth();
  if (!session?.user?.id || !isDatabaseConfigured()) {
    return null;
  }

  const [userRecord] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      image: users.image,
      credits: users.credits,
      creditResetTimestamp: users.creditResetTimestamp,
    })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (!userRecord) {
    return null;
  }

  const now = Date.now();
  let { credits, creditResetTimestamp } = userRecord;

  // Handle 24h credit reset logic
  if (credits <= 0 && !creditResetTimestamp) {
    creditResetTimestamp = now + 24 * 60 * 60 * 1000;
    await db
      .update(users)
      .set({ creditResetTimestamp })
      .where(eq(users.id, userRecord.id));
  } else if (credits > 0 && creditResetTimestamp) {
    creditResetTimestamp = null;
    await db
      .update(users)
      .set({ creditResetTimestamp: null })
      .where(eq(users.id, userRecord.id));
  } else if (creditResetTimestamp && now > creditResetTimestamp) {
    credits = 15;
    creditResetTimestamp = null;
    await db
      .update(users)
      .set({ credits: 15, creditResetTimestamp: null })
      .where(eq(users.id, userRecord.id));
  }

  return {
    ...userRecord,
    credits,
    creditResetTimestamp,
  };
}

export async function resetDevCredits(amount = 10000) {
  const session = await auth();
  if (!session?.user?.id || !isDatabaseConfigured()) {
    throw new Error('Not authenticated or database not configured.');
  }

  await db
    .update(users)
    .set({ credits: amount, creditResetTimestamp: null })
    .where(eq(users.id, session.user.id));

  return { credits: amount };
}


'use server';

import { eq } from 'drizzle-orm';
import { db, isDatabaseConfigured } from '@/db';
import { users } from '@/db/schema';
import { auth } from '@/auth';

export async function getUserProfile() {
  const session = await auth();
  if (!session?.user?.id || !isDatabaseConfigured()) {
    return null;
  }

  let [userRecord] = await db
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

  // Auto-provision user in our credits table on first Google / Email sign-in
  if (!userRecord && session.user.email) {
    const [existingByEmail] = await db
      .select()
      .from(users)
      .where(eq(users.email, session.user.email.toLowerCase()))
      .limit(1);

    if (existingByEmail) {
      userRecord = existingByEmail;
    } else {
      const [inserted] = await db
        .insert(users)
        .values({
          id: session.user.id,
          email: session.user.email.toLowerCase(),
          name: session.user.name || session.user.email.split('@')[0],
          image: session.user.image || null,
          credits: 15,
          creditResetTimestamp: null,
        })
        .returning({
          id: users.id,
          email: users.email,
          name: users.name,
          image: users.image,
          credits: users.credits,
          creditResetTimestamp: users.creditResetTimestamp,
        });
      userRecord = inserted;
    }
  }

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

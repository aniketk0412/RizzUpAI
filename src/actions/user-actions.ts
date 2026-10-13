'use server';

import { eq, or } from 'drizzle-orm';
import { cookies, headers } from 'next/headers';
import { db, isDatabaseConfigured } from '@/db';
import { users, deviceFingerprints } from '@/db/schema';
import { auth } from '@/auth';

export interface UserProfileResponse {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  credits: number;
  creditResetTimestamp: number | null;
  isPaid: boolean;
  deviceClaimedBefore?: boolean;
}

export async function getUserProfile(clientFingerprint?: {
  fingerprintHash?: string;
  deviceId?: string;
}): Promise<UserProfileResponse | null> {
  const session = await auth();
  if (!session?.user?.id || !isDatabaseConfigured()) {
    return null;
  }

  const cookieStore = await cookies();
  const headerStore = await headers();
  const cookieDeviceId = cookieStore.get('rizzup_did')?.value;
  const effectiveFingerprint = clientFingerprint?.fingerprintHash;
  const effectiveDeviceId = clientFingerprint?.deviceId || cookieDeviceId;

  let [userRecord] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      image: users.image,
      credits: users.credits,
      creditResetTimestamp: users.creditResetTimestamp,
      isPaid: users.isPaid,
      deviceId: users.deviceId,
    })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  let deviceClaimedBefore = false;

  // Auto-provision user in our credits table on first Google / Email sign-in
  if (!userRecord && session.user.email) {
    const [existingByEmail] = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        image: users.image,
        credits: users.credits,
        creditResetTimestamp: users.creditResetTimestamp,
        isPaid: users.isPaid,
        deviceId: users.deviceId,
      })
      .from(users)
      .where(eq(users.email, session.user.email.toLowerCase()))
      .limit(1);

    if (existingByEmail) {
      userRecord = existingByEmail;
    } else {
      let initialCredits = 15;

      // STRICT DEVICE FINGERPRINTING:
      // Verify if this physical device / browser has already claimed free credits
      if (effectiveFingerprint || effectiveDeviceId) {
        const conditions = [];
        if (effectiveFingerprint) {
          conditions.push(eq(deviceFingerprints.fingerprintHash, effectiveFingerprint));
        }
        if (effectiveDeviceId) {
          conditions.push(eq(deviceFingerprints.id, effectiveDeviceId));
        }

        const [existingDevice] = await db
          .select()
          .from(deviceFingerprints)
          .where(or(...conditions))
          .limit(1);

        if (existingDevice && existingDevice.freeCreditsClaimed) {
          // Device has already claimed free credits on a previous account!
          initialCredits = 0;
          deviceClaimedBefore = true;
        } else {
          // Newly seen device: register in device_fingerprints
          const primaryId = effectiveDeviceId || effectiveFingerprint || crypto.randomUUID();
          await db
            .insert(deviceFingerprints)
            .values({
              id: primaryId,
              fingerprintHash: effectiveFingerprint || primaryId,
              firstUserId: session.user.id,
              freeCreditsClaimed: true,
              ipAddress: headerStore.get('x-forwarded-for') || null,
              userAgent: headerStore.get('user-agent') || null,
              claimedAt: Date.now(),
              lastSeenAt: Date.now(),
            })
            .onConflictDoNothing();
        }
      }

      const [inserted] = await db
        .insert(users)
        .values({
          id: session.user.id,
          email: session.user.email.toLowerCase(),
          name: session.user.name || session.user.email.split('@')[0],
          image: session.user.image || null,
          credits: initialCredits,
          creditResetTimestamp: null,
          isPaid: false,
          deviceId: effectiveDeviceId || null,
        })
        .returning({
          id: users.id,
          email: users.email,
          name: users.name,
          image: users.image,
          credits: users.credits,
          creditResetTimestamp: users.creditResetTimestamp,
          isPaid: users.isPaid,
          deviceId: users.deviceId,
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
    isPaid: Boolean(userRecord.isPaid),
    credits,
    creditResetTimestamp,
    deviceClaimedBefore,
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

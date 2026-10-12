import { createNeonAuth } from '@neondatabase/auth/next/server';

export const neonAuth = createNeonAuth({
  baseUrl:
    process.env.NEON_AUTH_BASE_URL ||
    process.env.VITE_NEON_AUTH_URL ||
    'https://ep-little-forest-b8j7ue1q.neonauth.c-14.us-east-1.aws.neon.tech/neondb/auth',
  cookies: {
    secret:
      process.env.NEON_AUTH_COOKIE_SECRET ||
      process.env.AUTH_SECRET ||
      '12827c15cd604ca2a4b554ca906b4e865603c48a7b5a4478a872ace03276e146',
  },
});

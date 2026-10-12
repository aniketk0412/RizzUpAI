import { neonAuth } from '@/lib/auth/server';

export async function auth() {
  try {
    const { data: session } = await neonAuth.getSession();
    if (!session?.user) {
      return null;
    }
    return {
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        image: session.user.image,
      },
    };
  } catch (error) {
    console.error('Error getting Neon Auth session:', error);
    return null;
  }
}

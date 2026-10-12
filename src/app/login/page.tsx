'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Flame, ArrowRight, Check, Copy } from 'lucide-react';
import { authClient } from '@/lib/auth/client';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
    <title>Google</title>
    <path
      fill="currentColor"
      d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.02 1.02-2.62 1.98-4.48 1.98-3.62 0-6.55-2.92-6.55-6.55s2.93-6.55 6.55-6.55c2.03 0 3.33.82 4.1 1.59l2.42-2.42C18.28 2.38 15.65 1 12.48 1 7.18 1 3 5.08 3 10.4s4.18 9.4 9.48 9.4c2.82 0 5.1-1 6.7-2.73 1.67-1.8 2.2-4.22 2.2-6.38v-.54H12.48z"
    />
  </svg>
);

const sampleReplies = [
  {
    vibe: 'Chill',
    dot: 'bg-emerald-400',
    text: 'caught me. tastes like lawn clippings tbh i’m just here for the company',
  },
  {
    vibe: 'Smooth',
    dot: 'bg-primary',
    text: 'maybe a little. worked though didn’t it, we’re still talking',
  },
  {
    vibe: 'Bold',
    dot: 'bg-amber-400',
    text: 'i know a spot that’ll ruin all other matcha for you. free thursday?',
  },
];

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSample, setSelectedSample] = useState(1);
  const router = useRouter();
  const { refreshProfile } = useAuth();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { error } = await authClient.signIn.email({
        email: email.trim(),
        password,
      });

      if (error) {
        toast({
          title: 'Login Failed',
          description: error.message || 'Invalid email or password.',
          variant: 'destructive',
        });
      } else {
        await refreshProfile();
        router.push('/');
      }
    } catch (error: any) {
      toast({
        title: 'Login Failed',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const { error } = await authClient.signIn.social({
        provider: 'google',
        callbackURL: '/',
      });
      if (error) {
        toast({
          title: 'Google Sign-In Failed',
          description: error.message || 'Could not start Google Sign-In.',
          variant: 'destructive',
        });
        setIsLoading(false);
      }
    } catch (error: any) {
      toast({
        title: 'Google Sign-In Failed',
        description: error.message || 'Could not start Google Sign-In.',
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-dvh lg:h-dvh lg:overflow-hidden w-full bg-background text-foreground">
      {/* Left Showcase Panel — Locked Flex Column */}
      <div className="hidden lg:flex lg:w-[55%] xl:w-[57%] flex-col justify-between p-8 xl:p-10 border-r border-border/60 relative overflow-hidden bg-gradient-to-b from-background via-card/40 to-background">
        <div
          className="pointer-events-none absolute -top-36 -left-36 h-80 w-80 rounded-full opacity-15 blur-3xl"
          style={{ background: 'radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)' }}
        />

        {/* Top Bar */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shadow-md shadow-primary/20">
              <Flame className="h-4 w-4 fill-current" />
            </div>
            <span className="font-headline text-2xl tracking-tight">RizzUp</span>
          </div>
          <span className="text-xs text-muted-foreground font-medium">
            iMessage · Hinge · IG DMs
          </span>
        </div>

        {/* Center Content — Compact Flex Stack */}
        <div className="relative z-10 flex flex-col gap-6 max-w-xl my-auto">
          <div className="space-y-2.5">
            <h1 className="font-headline text-4xl xl:text-5xl leading-[1.04] tracking-tight">
              Don’t overthink the reply.{' '}
              <span className="italic text-primary">Send the right one.</span>
            </h1>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-md">
              Paste their text or drop a screenshot. Get three natural replies that actually sound like a human—not a bot.
            </p>
          </div>

          {/* Interactive Message Thread Card */}
          <div className="flex flex-col rounded-2xl border border-border/80 bg-card/85 backdrop-blur-md p-4 shadow-xl gap-3.5">
            {/* Incoming DM Header & Bubble */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground px-0.5">
                <span className="flex items-center gap-1.5 font-medium text-foreground/80">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  maya · Hinge
                </span>
                <span>just now</span>
              </div>
              <div className="self-start rounded-2xl rounded-tl-sm bg-secondary/90 border border-border/60 px-3.5 py-2 text-[13px] text-foreground">
                be honest did you just say you like matcha to impress me
              </div>
            </div>

            {/* 3 Flex Reply Rows */}
            <div className="flex flex-col gap-2 pt-1 border-t border-border/50">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground px-0.5">
                <span>Pick your angle</span>
                <span className="font-code text-[10px]">TAP TO PREVIEW</span>
              </div>

              {sampleReplies.map((item, idx) => {
                const isSelected = selectedSample === idx;
                return (
                  <button
                    key={item.vibe}
                    type="button"
                    onClick={() => {
                      setSelectedSample(idx);
                      navigator.clipboard?.writeText(item.text);
                    }}
                    className={`group flex items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 text-left transition-all ${
                      isSelected
                        ? 'border-primary/80 bg-primary/[0.08] shadow-sm'
                        : 'border-border/60 bg-background/60 hover:border-border hover:bg-background/90'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="inline-flex items-center gap-1.5 shrink-0 rounded-md bg-secondary px-2 py-0.5 text-[11px] font-medium text-foreground/90">
                        <span className={`h-1.5 w-1.5 rounded-full ${item.dot}`} />
                        {item.vibe}
                      </span>
                      <p className="text-[13px] text-foreground/95 leading-snug truncate sm:whitespace-normal">
                        {item.text}
                      </p>
                    </div>

                    <span
                      className={`shrink-0 inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium transition-colors ${
                        isSelected
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground group-hover:text-foreground'
                      }`}
                    >
                      {isSelected ? (
                        <>
                          <Check className="h-3 w-3" />
                          <span>Selected</span>
                        </>
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="relative z-10 flex items-center justify-between text-xs text-muted-foreground border-t border-border/40 pt-4">
          <div className="flex items-center gap-5">
            <span>Screenshot support</span>
            <span>·</span>
            <span>Zero cringe filter</span>
            <span>·</span>
            <span>15 free daily replies</span>
          </div>
          <span className="font-code text-[11px]">RIZZUP</span>
        </div>
      </div>

      {/* Right Sign-In Column — Flex Centered */}
      <div className="flex-1 flex flex-col justify-between p-6 sm:p-8 xl:p-10 bg-background overflow-y-auto">
        <div className="flex items-center justify-between lg:justify-end">
          <div className="flex items-center gap-2 lg:hidden">
            <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
              <Flame className="h-4 w-4 fill-current" />
            </div>
            <span className="font-headline text-xl">RizzUp</span>
          </div>
          <Link
            href="/signup"
            className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            New here? <span className="text-primary underline underline-offset-4">Create account →</span>
          </Link>
        </div>

        <div className="w-full max-w-sm mx-auto my-auto flex flex-col gap-6 py-4">
          <div className="space-y-1.5">
            <h2 className="font-headline text-3xl sm:text-4xl tracking-tight">
              Sign in to RizzUp
            </h2>
            <p className="text-sm text-muted-foreground">
              Continue with Google or your email below.
            </p>
          </div>

          <div className="flex flex-col gap-3.5">
            <Button
              type="button"
              variant="outline"
              className="w-full h-11 rounded-xl border-border bg-card hover:bg-accent/60 text-foreground font-medium transition-all"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
            >
              <GoogleIcon className="mr-2.5 h-4 w-4" />
              Continue with Google
            </Button>

            <div className="relative py-1.5">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border/70" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-background px-3 font-code text-[10px] uppercase tracking-widest text-muted-foreground">
                  or email
                </span>
              </div>
            </div>

            <form onSubmit={handleLogin} className="flex flex-col gap-3.5">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-medium text-foreground/85">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@domain.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="h-10 rounded-xl bg-card border-border/80 focus-visible:ring-primary"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-medium text-foreground/85">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="h-10 rounded-xl bg-card border-border/80 focus-visible:ring-primary"
                />
              </div>

              <Button
                type="submit"
                className="w-full h-10 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md shadow-primary/20 transition-all mt-1"
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            No account yet?{' '}
            <Link href="/signup" className="font-semibold text-foreground hover:text-primary underline underline-offset-4">
              Sign up for 15 free daily replies
            </Link>
          </p>
        </div>

        <div className="text-center lg:text-left">
          <Link href="/privacy-policy" className="text-[11px] text-muted-foreground hover:underline">
            Privacy & Terms
          </Link>
        </div>
      </div>
    </div>
  );
}

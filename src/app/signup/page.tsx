'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Check } from 'lucide-react';
import { RizzLogo } from '@/components/rizz-logo';
import { authClient } from '@/lib/auth/client';
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

const vibeExamples = [
  {
    vibe: 'Chill',
    dot: 'bg-emerald-400',
    desc: 'Low-key, dry humor when you don’t want to look like you’re trying too hard.',
    sample: '“bold of you to assume i don’t already have better plans (i don’t)”',
  },
  {
    vibe: 'Smooth',
    dot: 'bg-primary',
    desc: 'Confident push-pull that keeps the conversation moving forward.',
    sample: '“you’re trouble. pick a spot for thursday and i’ll co-sign”',
  },
  {
    vibe: 'Bold',
    dot: 'bg-amber-400',
    desc: 'Direct, flirty lines that skip the boring small talk and set up the link.',
    sample: '“skip the texting marathon, let’s grab drinks tomorrow at 8”',
  },
];

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({
        title: 'Passwords do not match',
        variant: 'destructive',
      });
      return;
    }
    setIsLoading(true);
    try {
      const displayName = email.split('@')[0] || 'Rizzler';
      const { error } = await authClient.signUp.email({
        email,
        password,
        name: displayName,
      });

      if (error) {
        toast({
          title: 'Signup Failed',
          description: error.message || 'Could not create account.',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Welcome to RizzUp!',
        description: 'Your 15 free daily replies are ready.',
      });

      router.push('/');
      router.refresh();
    } catch (error: any) {
      toast({
        title: 'Signup Failed',
        description: error.message || 'Could not create account.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setIsLoading(true);
    try {
      const { error } = await authClient.signIn.social({
        provider: 'google',
        callbackURL: '/',
      });
      if (error) {
        throw new Error(error.message || 'Could not start Google Sign-In.');
      }
    } catch (error: any) {
      toast({
        title: 'Google Sign-Up Failed',
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
          className="pointer-events-none absolute -bottom-36 -right-36 h-96 w-96 rounded-full opacity-20 blur-3xl animate-ambient-drift"
          style={{ background: 'radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)' }}
        />

        <div className="relative z-10 flex items-center justify-between animate-reveal-up">
          <RizzLogo size="md" />
          <span className="text-xs text-muted-foreground font-medium">
            15 free replies every day
          </span>
        </div>

        <div className="relative z-10 flex flex-col gap-6 max-w-xl my-auto">
          <div className="space-y-2.5 animate-reveal-up delay-100">
            <h1 className="font-headline text-4xl xl:text-5xl leading-[1.04] tracking-tight">
              Three angles for <span className="italic text-primary">every text</span>.
            </h1>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-md">
              Stop staring at the typing indicator. Get three distinct replies tailored to who you’re texting and how bold you want to play it.
            </p>
          </div>

          <div className="flex flex-col gap-2.5">
            {vibeExamples.map((item, idx) => (
              <div
                key={item.vibe}
                style={{ animationDelay: `${200 + idx * 130}ms` }}
                className="flex flex-col gap-1.5 rounded-2xl border border-border/75 bg-card/80 hover:border-primary/50 hover:-translate-y-0.5 p-3.5 animate-reveal-up smooth-interactive"
              >
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-secondary px-2 py-0.5 text-xs font-medium">
                    <span className={`h-1.5 w-1.5 rounded-full ${item.dot}`} />
                    {item.vibe}
                  </span>
                  <span className="text-[11px] text-muted-foreground">{item.desc}</span>
                </div>
                <p className="text-[13px] font-medium text-foreground/95 pl-1">
                  {item.sample}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between text-xs text-muted-foreground border-t border-border/40 pt-4 animate-reveal-up delay-400">
          <div className="flex items-center gap-5">
            <span className="inline-flex items-center gap-1">
              <Check className="h-3.5 w-3.5 text-primary" /> Daily refill included
            </span>
            <span className="inline-flex items-center gap-1">
              <Check className="h-3.5 w-3.5 text-primary" /> Screenshot reading
            </span>
            <span className="inline-flex items-center gap-1">
              <Check className="h-3.5 w-3.5 text-primary" /> One-tap copy
            </span>
          </div>
          <span className="font-code text-[11px]">RIZZUP</span>
        </div>
      </div>

      {/* Right Signup Column */}
      <div className="flex-1 flex flex-col justify-between p-6 sm:p-8 xl:p-10 bg-background overflow-y-auto">
        <div className="flex items-center justify-between lg:justify-end animate-reveal-up">
          <div className="lg:hidden">
            <RizzLogo size="sm" />
          </div>
          <Link
            href="/login"
            className="text-xs font-medium text-muted-foreground hover:text-foreground smooth-interactive"
          >
            Already have an account? <span className="text-primary underline underline-offset-4">Sign in →</span>
          </Link>
        </div>

        <div className="w-full max-w-sm mx-auto my-auto flex flex-col gap-5 py-4 animate-reveal-up delay-100">
          <div className="space-y-1">
            <h2 className="font-headline text-3xl sm:text-4xl tracking-tight">
              Create your account
            </h2>
            <p className="text-sm text-muted-foreground">
              Includes 15 free replies every 24 hours.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              type="button"
              variant="outline"
              className="w-full h-10 rounded-xl border-border bg-card hover:bg-accent/60 hover:-translate-y-0.5 text-foreground font-medium smooth-interactive"
              onClick={handleGoogleSignUp}
              disabled={isLoading}
            >
              <GoogleIcon className="mr-2.5 h-4 w-4" />
              Continue with Google
            </Button>

            <div className="relative py-1">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border/70" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-background px-3 font-code text-[10px] uppercase tracking-widest text-muted-foreground">
                  or email
                </span>
              </div>
            </div>

            <form onSubmit={handleSignup} className="flex flex-col gap-3">
              <div className="space-y-1">
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
                  className="h-10 rounded-xl bg-card border-border/80 focus-visible:ring-primary smooth-interactive"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="password" className="text-xs font-medium text-foreground/85">
                  Password (min. 8 characters)
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="h-10 rounded-xl bg-card border-border/80 focus-visible:ring-primary smooth-interactive"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="confirm-password" className="text-xs font-medium text-foreground/85">
                  Confirm password
                </Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="••••••••"
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                  className="h-10 rounded-xl bg-card border-border/80 focus-visible:ring-primary smooth-interactive"
                />
              </div>

              <Button
                type="submit"
                className="group w-full h-10 rounded-xl bg-primary hover:bg-primary/90 hover:-translate-y-0.5 text-primary-foreground font-semibold shadow-md shadow-primary/20 smooth-interactive mt-1"
                disabled={isLoading}
              >
                {isLoading ? 'Creating account...' : 'Create Account'}
                <ArrowRight className="ml-2 h-4 w-4 smooth-interactive group-hover:translate-x-1" />
              </Button>
            </form>
          </div>
        </div>

        <div className="text-center lg:text-left animate-reveal-up delay-200">
          <Link href="/privacy-policy" className="text-[11px] text-muted-foreground hover:underline smooth-interactive">
            Privacy & Terms
          </Link>
        </div>
      </div>
    </div>
  );
}

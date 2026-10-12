'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Flame, ArrowRight, Sparkles, Check } from 'lucide-react';
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
        description: 'Your 15 free daily credits are ready.',
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
    <div className="min-h-screen w-full bg-background text-foreground grid lg:grid-cols-12">
      {/* Left Editorial Showcase */}
      <div className="hidden lg:flex lg:col-span-7 flex-col justify-between p-12 xl:p-16 border-r border-border/70 relative overflow-hidden bg-gradient-to-br from-background via-card to-background">
        <div
          className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)' }}
        />

        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/25">
              <Flame className="h-5 w-5 fill-current" />
            </div>
            <span className="font-headline text-2xl tracking-tight">RizzUp</span>
            <span className="font-code text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full border border-primary/30 text-primary bg-primary/10">
              v2.5 Studio
            </span>
          </div>
          <span className="font-code text-xs text-muted-foreground">
            15 CREDITS / DAY INCLUDED
          </span>
        </div>

        <div className="relative z-10 max-w-xl my-auto space-y-8">
          <div className="space-y-3">
            <p className="font-code text-xs uppercase tracking-[0.2em] text-primary">
              Your Unfair Advantage
            </p>
            <h1 className="font-headline text-5xl xl:text-6xl leading-[1.03] tracking-tight">
              Three tailored lines for <span className="italic text-primary">every situation</span>.
            </h1>
            <p className="text-muted-foreground text-base leading-relaxed max-w-md">
              Whether you’re breaking the ice on Hinge, replying to a late-night story, or keeping the spark alive—pick the exact energy you want in one tap.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { num: '01', title: 'The Tease', desc: 'Low-pressure playful banter that’s effortless to reply to.' },
              { num: '02', title: 'Smooth', desc: 'Confident, charming, and naturally magnetic.' },
              { num: '03', title: 'High Voltage', desc: 'Bold, witty lines that cut through boring small talk.' },
            ].map((item) => (
              <div key={item.num} className="rounded-xl border border-border/80 bg-card/70 p-4 space-y-2">
                <span className="font-code text-xs text-primary font-semibold">{item.num}</span>
                <h3 className="font-headline text-xl">{item.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between text-xs text-muted-foreground border-t border-border/50 pt-6">
          <div className="flex items-center gap-6">
            <span className="inline-flex items-center gap-1"><Check className="h-3.5 w-3.5 text-primary" /> Free Daily Refills</span>
            <span className="inline-flex items-center gap-1"><Check className="h-3.5 w-3.5 text-primary" /> Screenshot Vision</span>
            <span className="inline-flex items-center gap-1"><Check className="h-3.5 w-3.5 text-primary" /> Instant One-Tap Copy</span>
          </div>
          <span className="font-code">RIZZUP.AI</span>
        </div>
      </div>

      {/* Right Signup Form */}
      <div className="lg:col-span-5 flex flex-col justify-between p-6 sm:p-12 xl:p-16 bg-background">
        <div className="flex items-center justify-between lg:justify-end">
          <div className="flex items-center gap-2 lg:hidden">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
              <Flame className="h-4 w-4 fill-current" />
            </div>
            <span className="font-headline text-xl">RizzUp</span>
          </div>
          <Link
            href="/login"
            className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Already a member? <span className="text-primary underline underline-offset-4">Sign in →</span>
          </Link>
        </div>

        <div className="w-full max-w-sm mx-auto my-auto space-y-7 py-8">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 font-code text-[11px] uppercase tracking-widest text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              15 Free Daily Credits
            </div>
            <h2 className="font-headline text-4xl tracking-tight">
              Create your account
            </h2>
            <p className="text-sm text-muted-foreground">
              Start generating 3-option replies in seconds.
            </p>
          </div>

          <div className="space-y-4">
            <Button
              type="button"
              variant="outline"
              className="w-full h-11 rounded-xl border-border bg-card hover:bg-accent/60 text-foreground font-medium transition-all"
              onClick={handleGoogleSignUp}
              disabled={isLoading}
            >
              <GoogleIcon className="mr-2.5 h-4 w-4" />
              Sign up with Google
            </Button>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border/70" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-background px-3 font-code text-[10px] uppercase tracking-widest text-muted-foreground">
                  Or with email
                </span>
              </div>
            </div>

            <form onSubmit={handleSignup} className="space-y-3.5">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-medium text-foreground/85">
                  Email address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@domain.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="h-11 rounded-xl bg-card border-border/80 focus-visible:ring-primary"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-medium text-foreground/85">
                  Password (min. 8 chars)
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
                  className="h-11 rounded-xl bg-card border-border/80 focus-visible:ring-primary"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirm-password" className="text-xs font-medium text-foreground/85">
                  Confirm Password
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
                  className="h-11 rounded-xl bg-card border-border/80 focus-visible:ring-primary"
                />
              </div>

              <Button
                type="submit"
                className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg shadow-primary/20 transition-all mt-2"
                disabled={isLoading}
              >
                {isLoading ? 'Creating Account...' : 'Unlock Your Wingman'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>
          </div>
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

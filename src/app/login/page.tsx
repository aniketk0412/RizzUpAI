'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Flame, ArrowRight, Sparkles, Check } from 'lucide-react';
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

const previewDeck = [
  {
    idx: '01',
    tag: 'PLAYFUL TEASE',
    text: 'Only my signature pasta, and yes it requires a strict NDA and a second glass of wine.',
    active: false,
  },
  {
    idx: '02',
    tag: 'THE SWEET SPOT',
    text: 'I make a dangerously good vodka rigatoni. You’re welcome to be the judge this Thursday.',
    active: true,
  },
  {
    idx: '03',
    tag: 'HIGH VOLTAGE',
    text: 'Careful, if I cook for you once you’re going to start finding excuses to come over.',
    active: false,
  },
];

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        toast({
          title: 'Login Failed',
          description: 'Invalid email or password.',
          variant: 'destructive',
        });
      } else {
        router.push('/');
        router.refresh();
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
      await signIn('google', { callbackUrl: '/' });
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
    <div className="min-h-screen w-full bg-background text-foreground grid lg:grid-cols-12">
      {/* Left Editorial Showcase (7 columns on desktop) */}
      <div className="hidden lg:flex lg:col-span-7 flex-col justify-between p-12 xl:p-16 border-r border-border/70 relative overflow-hidden bg-gradient-to-br from-background via-card to-background">
        <div
          className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)' }}
        />

        {/* Brand Header */}
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
            3-OPTION CALIBRATED WINGMAN
          </span>
        </div>

        {/* Center Editorial + Live Interactive Artifact */}
        <div className="relative z-10 max-w-xl my-auto space-y-8">
          <div className="space-y-3">
            <p className="font-code text-xs uppercase tracking-[0.2em] text-primary">
              Instant Chemistry Engine
            </p>
            <h1 className="font-headline text-5xl xl:text-6xl leading-[1.03] tracking-tight">
              Never leave ’em on read.{' '}
              <span className="italic text-primary">Never send a dry text</span> again.
            </h1>
            <p className="text-muted-foreground text-base leading-relaxed max-w-md">
              Paste their message or drop a screenshot from Hinge, Tinder, or iMessage. Get three calibrated angles—from playful banter to high-voltage charm.
            </p>
          </div>

          {/* Live Simulated Conversation Deck */}
          <div className="rounded-2xl border border-border/80 bg-background/80 backdrop-blur-md p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-medium">Incoming text · Crush</span>
              </div>
              <span className="font-code text-[11px] text-muted-foreground">TONE: FLIRTY</span>
            </div>

            <div className="inline-block rounded-2xl rounded-tl-sm bg-secondary px-4 py-2.5 text-sm font-medium">
              “Wait you actually know how to cook?? 👀”
            </div>

            <div className="grid grid-cols-3 gap-2.5 pt-1">
              {previewDeck.map((card) => (
                <div
                  key={card.idx}
                  className={`rounded-xl border p-3.5 flex flex-col justify-between transition-all ${
                    card.active
                      ? 'border-primary bg-primary/[0.07] ring-1 ring-primary/30'
                      : 'border-border/70 bg-card/60 opacity-80'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-code text-[10px] tracking-wider text-primary font-semibold">
                        {card.idx} / {card.tag}
                      </span>
                      {card.active && (
                        <span className="inline-flex items-center gap-0.5 font-code text-[10px] text-emerald-400">
                          <Check className="h-3 w-3" /> COPIED
                        </span>
                      )}
                    </div>
                    <p className="text-xs leading-relaxed text-foreground/95">
                      “{card.text}”
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Specs */}
        <div className="relative z-10 flex items-center justify-between text-xs text-muted-foreground border-t border-border/50 pt-6">
          <div className="flex items-center gap-6">
            <span>✓ Screenshot Vision</span>
            <span>✓ 3 Distinct Energy Levels</span>
            <span>✓ 15 Free Daily Credits</span>
          </div>
          <span className="font-code">RIZZUP.AI</span>
        </div>
      </div>

      {/* Right Authentication Studio (5 columns on desktop) */}
      <div className="lg:col-span-5 flex flex-col justify-between p-6 sm:p-12 xl:p-16 bg-background">
        <div className="flex items-center justify-between lg:justify-end">
          <div className="flex items-center gap-2 lg:hidden">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
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

        <div className="w-full max-w-sm mx-auto my-auto space-y-8 py-8">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 font-code text-[11px] uppercase tracking-widest text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Welcome Back
            </div>
            <h2 className="font-headline text-4xl tracking-tight">
              Step into the studio
            </h2>
            <p className="text-sm text-muted-foreground">
              Sign in with Google or your email to access your wingman.
            </p>
          </div>

          <div className="space-y-4">
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

            <form onSubmit={handleLogin} className="space-y-4">
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
                  className="h-11 rounded-xl bg-card border-border/80 focus-visible:ring-primary"
                />
              </div>

              <Button
                type="submit"
                className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg shadow-primary/20 transition-all"
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign In to RizzUp'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            Don&apos;t have an account yet?{' '}
            <Link href="/signup" className="font-semibold text-foreground hover:text-primary underline underline-offset-4">
              Get 15 free daily credits
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

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';

interface CreditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  credits: number;
  resetTimestamp: number | null;
}

const creditPlans = [
  { credits: 50, price: 99, bestValue: false },
  { credits: 120, price: 199, bestValue: false },
  { credits: 300, price: 449, bestValue: true },
  { credits: 1000, price: 999, bestValue: false },
];

export default function CreditDialog({ open, onOpenChange, credits, resetTimestamp }: CreditDialogProps) {
  const [countdown, setCountdown] = useState('00:00:00');
  const { user } = useAuth();

  useEffect(() => {
    if (!user || credits > 0 || !resetTimestamp) {
      setCountdown('00:00:00');
      return;
    }

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = resetTimestamp - now;

      if (distance < 0) {
        setCountdown('00:00:00');
        clearInterval(interval);
        return;
      }

      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setCountdown(
        `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [credits, resetTimestamp, user]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[825px]">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">Manage Your Credits</DialogTitle>
          <DialogDescription>
            You have {credits} credits remaining. Need more? Choose a plan below.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <Card className="text-center bg-accent/30 border-accent">
            <CardHeader>
              <CardTitle className="font-headline">Free Credits Reset In</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-5xl font-bold font-mono text-accent-foreground">{countdown}</p>
              <p className="text-muted-foreground mt-2">
                When you run out of credits, you can wait for a free refill.
              </p>
            </CardContent>
          </Card>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {creditPlans.map((plan) => (
              <Card key={plan.credits} className="flex flex-col">
                {plan.bestValue && (
                  <Badge className="absolute -top-3 right-4 bg-primary text-primary-foreground">Best Value</Badge>
                )}
                <CardHeader className="flex-grow">
                  <CardTitle className="font-headline">{plan.credits} Credits</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col justify-end items-center space-y-4">
                  <p className="text-3xl font-bold">₹{plan.price}</p>
                  <Button asChild className="w-full">
                    <Link href="/payment-placeholder">Buy Now</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

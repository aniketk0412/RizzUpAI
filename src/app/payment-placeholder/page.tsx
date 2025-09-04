import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function PaymentPlaceholder() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-md mx-4 text-center shadow-2xl">
        <CardHeader>
          <CardTitle className="font-headline text-3xl">Coming Soon!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Our payment system is currently under construction. We're working hard to bring you
            credit purchasing options. Please check back later!
          </p>
          <Button asChild>
            <Link href="/">
              <ArrowLeft className="mr-2" />
              Go Back to Chat
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

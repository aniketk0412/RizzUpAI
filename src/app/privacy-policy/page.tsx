import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function PrivacyPolicyPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <CardTitle className="text-3xl font-headline">Privacy Policy</CardTitle>
          <CardDescription>Last updated: {new Date().toLocaleDateString()}</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[60vh] pr-6">
            <div className="space-y-4 text-sm text-muted-foreground">
              <p>
                Welcome to ChatAI. We are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our application.
              </p>
              
              <h3 className="font-headline text-lg text-foreground">1. Information We Collect</h3>
              <p>
                We may collect information about you in a variety of ways. The information we may collect on the Service includes:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>
                  <strong>Personal Data:</strong> Personally identifiable information, such as your name, email address, that you voluntarily give to us when you register with the Service.
                </li>
                <li>
                  <strong>Derivative Data:</strong> Information our servers automatically collect when you access the Service, such as your IP address, your browser type, your operating system, your access times, and the pages you have viewed directly before and after accessing the Service.
                </li>
                <li>
                  <strong>Data from aI interactions:</strong> We collect and store the chat messages, images, and other content you provide during your interactions with our AI service to improve and provide the service.
                </li>
              </ul>

              <h3 className="font-headline text-lg text-foreground">2. Use of Your Information</h3>
              <p>
                Having accurate information about you permits us to provide you with a smooth, efficient, and customized experience. Specifically, we may use information collected about you via the Service to:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>Create and manage your account.</li>
                <li>Email you regarding your account.</li>
                <li>Enable user-to-user communications.</li>
                <li>Monitor and analyze usage and trends to improve your experience with the Service.</li>
                <li>Prevent fraudulent transactions, monitor against theft, and protect against criminal activity.</li>
                <li>Process payments and refunds.</li>
                <li>Provide and improve our AI services.</li>
              </ul>

              <h3 className="font-headline text-lg text-foreground">3. Disclosure of Your Information</h3>
              <p>
                We may share information we have collected about you in certain situations. Your information may be disclosed as follows:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>
                  <strong>By Law or to Protect Rights:</strong> If we believe the release of information about you is necessary to respond to legal process, to investigate or remedy potential violations of our policies, or to protect the rights, property, and safety of others, we may share your information as permitted or required by any applicable law, rule, or regulation.
                </li>
                 <li>
                  <strong>Third-Party Service Providers:</strong> We may share your information with third parties that perform services for us or on our behalf, including payment processing, data analysis, email delivery, hosting services, customer service, and marketing assistance.
                </li>
                 <li>
                  <strong>AI Model Providers:</strong> Content you provide to the AI, such as chat messages and images, will be shared with our AI model providers (e.g., Google) to facilitate the service. This data may be used by them to improve their models.
                </li>
              </ul>
              
              <h3 className="font-headline text-lg text-foreground">4. Security of Your Information</h3>
              <p>
                We use administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable, and no method of data transmission can be guaranteed against any interception or other type of misuse.
              </p>

              <h3 className="font-headline text-lg text-foreground">5. Policy for Children</h3>
              <p>
                We do not knowingly solicit information from or market to children under the age of 13. If you become aware of any data we have collected from children under age 13, please contact us using the contact information provided below.
              </p>
              
              <h3 className="font-headline text-lg text-foreground">6. Changes to This Privacy Policy</h3>
               <p>
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page. You are advised to review this Privacy Policy periodically for any changes.
              </p>

              <h3 className="font-headline text-lg text-foreground">7. Contact Us</h3>
              <p>
                If you have questions or comments about this Privacy Policy, please contact us at: privacy@chatai.example.com
              </p>
            </div>
          </ScrollArea>
          <div className="mt-6 flex justify-end">
            <Button asChild variant="outline">
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

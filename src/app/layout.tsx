import type {Metadata} from 'next';
import { cn } from "@/lib/utils";
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { ThemeProvider } from '@/components/app/theme-provider';
import { AnimatedBackground } from '@/components/app/animated-background';
import { SpeedInsights } from '@vercel/speed-insights/next';

export const metadata: Metadata = {
  title: 'FocusMentor AI',
  description: 'An autonomous AI-powered study timer to maximize your productivity.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Source+Code+Pro&display=swap" rel="stylesheet" />
      </head>
      <body className={cn("font-body antialiased")}>
        <ThemeProvider>
          <FirebaseClientProvider>
            <AnimatedBackground />
            <div className="relative z-10">
              {children}
            </div>
            <Toaster />
          </FirebaseClientProvider>
        </ThemeProvider>
        <SpeedInsights />
      </body>
    </html>
  );
}

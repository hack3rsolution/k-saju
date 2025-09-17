import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import AuthStatus from '@/components/AuthStatus';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'K-Saju Web App',
  description: 'K-Saju web application',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <header className="sticky top-0 bg-white/70 backdrop-blur border-b">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <a href="/" className="font-semibold">K-Saju</a>
            <nav className="flex items-center gap-4 text-sm text-gray-700">
              <a href="/about" className="hover:underline">About</a>
              <a href="/pricing" className="hover:underline">Pricing</a>
              <a href="/ui-kit" className="hover:underline">UI Kit</a>
            </nav>
            <AuthStatus />
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}

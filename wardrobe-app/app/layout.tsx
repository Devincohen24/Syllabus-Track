import type { Metadata } from 'next';
import './globals.css';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'StyleAI — Smart Wardrobe',
  description: 'AI-powered wardrobe assistant that picks your outfit based on weather and calendar',
};

function Nav() {
  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-3xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <Link href="/" className="flex items-center gap-2 font-bold text-gray-900 text-lg">
            <span>👗</span>
            <span>StyleAI</span>
          </Link>
          <div className="flex items-center gap-1">
            <Link
              href="/"
              className="px-3 py-1.5 text-sm text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors font-medium"
            >
              Today
            </Link>
            <Link
              href="/closet"
              className="px-3 py-1.5 text-sm text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors font-medium"
            >
              Closet
            </Link>
            <Link
              href="/settings"
              className="px-3 py-1.5 text-sm text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors font-medium"
            >
              Settings
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col bg-gray-50">
        <Nav />
        <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-6">{children}</main>
        <footer className="text-center text-xs text-gray-400 py-4 border-t border-gray-200 bg-white">
          StyleAI — Powered by Claude AI, OpenWeatherMap &amp; Google Calendar
        </footer>
      </body>
    </html>
  );
}

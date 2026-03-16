// app/(auth)/layout.tsx
import { ReactNode } from 'react';
import Link from 'next/link';
import { Clock } from 'lucide-react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen relative overflow-hidden bg-linear-to-br from-slate-50 to-indigo-50">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-slate-100 mask-[linear-gradient(0deg,white,rgba(255,255,255,0.6))]" />
      
      {/* Header */}
      <header className="relative z-10 pt-8 px-6">
        <div className="max-w-7xl mx-auto">
          <Link href="/" className="flex items-center gap-3 text-2xl font-bold text-slate-800">
            <div className="p-2 bg-linear-to-r from-blue-500 to-purple-600 rounded-xl">
              <Clock className="h-6 w-6 text-white" />
            </div>
            <span>TimeLocus</span>
          </Link>
        </div>
      </header>

      <main className="relative z-10">
        {children}
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-8 px-6 text-center text-slate-600 text-sm">
        <p>© 2024 TimeLocus. All rights reserved.</p>
        <div className="mt-2 space-x-4">
          <Link href="/privacy" className="hover:text-slate-800">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-slate-800">Terms of Service</Link>
          <Link href="/contact" className="hover:text-slate-800">Contact</Link>
        </div>
      </footer>
    </div>
  );
}

'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import { Clock } from 'lucide-react'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-950 via-purple-950 to-blue-950 selection:bg-purple-500/30">
      
      {/* Background glow / Ambient Lighting */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-900/10 to-purple-900/20" />

      {/* Header */}
      <header className="relative z-10 pt-8 px-6">
        <div className="max-w-7xl mx-auto">
          <Link href="/" className="inline-flex items-center gap-3 text-2xl font-bold text-white transition-opacity hover:opacity-90">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg shadow-blue-500/20">
              <Clock className="h-6 w-6 text-white" />
            </div>
            <span className="tracking-tight">TimeLocus</span>
          </Link>
        </div>
      </header>

      {/* Main content - Centered for Login/Signup cards */}
      <main className="relative z-10 flex flex-col justify-center items-center py-16 px-4 min-h-[calc(100vh-180px)]">
        {children}
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-8 px-6 text-center">
        <p className="text-slate-400 text-sm">
          © {new Date().getFullYear()} TimeLocus. All rights reserved.
        </p>
        <div className="mt-3 space-x-6">
          <Link href="/privacy" className="text-slate-500 hover:text-white text-xs transition-colors">
            Privacy Policy
          </Link>
          <Link href="/terms" className="text-slate-500 hover:text-white text-xs transition-colors">
            Terms of Service
          </Link>
          <Link href="/contact" className="text-slate-500 hover:text-white text-xs transition-colors">
            Contact
          </Link>
        </div>
      </footer>
    </div>
  )
}

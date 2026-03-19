'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import { Clock } from 'lucide-react'

export default function AuthLayout({ children }: { children: ReactNode }) {

  return (
<<<<<<< HEAD
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-950 via-purple-950 to-blue-950">

      {/* Background glow */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-900/10 to-purple-900/20" />

=======
    <div className="min-h-screen relative overflow-hidden bg-linear-to-br from-slate-50 to-indigo-50">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-slate-100 mask-[linear-gradient(0deg,white,rgba(255,255,255,0.6))]" />
      
>>>>>>> parent of 3bf0053 (frontend enhancement)
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

      {/* Main content */}
      <main className="relative z-10 flex justify-center items-center py-16 px-4">
        {children}
      </main>

      {/* Footer */}
<<<<<<< HEAD
      <footer className="relative z-10 py-6 text-center text-slate-400 text-sm">
        © 2024 TimeLocus
=======
      <footer className="relative z-10 py-8 px-6 text-center text-slate-600 text-sm">
        <p>© 2024 TimeLocus. All rights reserved.</p>
        <div className="mt-2 space-x-4">
          <Link href="/privacy" className="hover:text-slate-800">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-slate-800">Terms of Service</Link>
          <Link href="/contact" className="hover:text-slate-800">Contact</Link>
        </div>
>>>>>>> parent of 3bf0053 (frontend enhancement)
      </footer>

    </div>
  )
}
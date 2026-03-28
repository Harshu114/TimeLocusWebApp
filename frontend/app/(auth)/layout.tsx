// app/(auth)/layout.tsx
import type { Metadata } from 'next';
import '../globals.css'; // Changed from './' to '../'

export const metadata: Metadata = {
  title: 'TimeLocus',
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

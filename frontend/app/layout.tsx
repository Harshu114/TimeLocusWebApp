import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '../lib/ThemeContext';

export const metadata: Metadata = {
  title: 'TimeLocus',
  description: 'AI-Powered Time Management',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
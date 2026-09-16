import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Damodar Prayas Admin',
  description: 'Administration portal for Damodar Prayas',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="hi">
      <body>{children}</body>
    </html>
  );
}

import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Aaltoes Food Ordering',
  description: 'Automated event food ordering system',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

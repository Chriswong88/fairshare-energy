import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import './sections.css';
import './seller-dashboard.css';
import './seller-marketplace.css';
import './create-listing.css';
import './my-listings.css';
import './edit-listing.css';
import './listing-summary.css';
import './earnings.css';
import './impact.css';
import './marketplace.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'FairShare Energy | Wollongong',
  description: 'A fair community energy marketplace for Wollongong.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}

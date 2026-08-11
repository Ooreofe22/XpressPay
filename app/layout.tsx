import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Inter, Geist_Mono } from 'next/font/google'
import { AppProvider } from '@/context/AppContext'
import './globals.css'

const inter = Inter({ variable: '--font-inter', subsets: ['latin'] })
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'PayXpress Banking that moves at the speed of your business',
  description:
      'Send money, pay bills, and manage cards from one secure account. PayXpress gives Nigerians a faster, cleaner way to handle money on the web and on the go. Licensed by the CBN, insured by the NDIC.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#0B6E4F',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
                                     children,
                                   }: Readonly<{
  children: React.ReactNode
}>) {
  return (
      <html lang="en" className={`${inter.variable} ${geistMono.variable} bg-background`}>
      <body className="font-sans antialiased bg-background text-foreground">
      <AppProvider>
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </AppProvider>
      </body>
      </html>
  )
}
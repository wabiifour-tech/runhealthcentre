import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'TeleHealth Nigeria - Quality Healthcare, Anytime, Anywhere',
  description: 'Connect with licensed Nigerian doctors through secure video consultations. Get prescriptions, lab requests, and medical advice from the comfort of your home.',
  keywords: 'telehealth, nigeria, doctor consultation, video call doctor, online doctor, medical consultation, healthcare nigeria, telemedicine africa',
  authors: [{ name: 'TeleHealth Nigeria' }],
  openGraph: {
    title: 'TeleHealth Nigeria - Quality Healthcare, Anytime, Anywhere',
    description: 'Connect with licensed Nigerian doctors through secure video consultations.',
    type: 'website',
    locale: 'en_NG',
    siteName: 'TeleHealth Nigeria',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TeleHealth Nigeria',
    description: 'Quality Healthcare, Anytime, Anywhere',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}

import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#1e40af",
};

export const metadata: Metadata = {
  title: "Redeemer's University Health Centre (RUHC) | Health Management System",
  description: "Redeemer's University Health Centre (RUHC), Nigeria - Comprehensive Health Management System for patient care, appointments, pharmacy, laboratory, and healthcare services.",
  keywords: ["Redeemer's University Health Centre", "RUHC", "Health Management System", "Healthcare Nigeria", "Redeemer's University", "Medical", "Patient Care", "Hospital System"],
  authors: [{ name: "RUHC IT Department" }],
  manifest: "/manifest.json",
  icons: {
    icon: "/logo.jpg",
    apple: "/logo.jpg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "RUHC HMS",
  },
  formatDetection: {
    telephone: true,
  },
  openGraph: {
    title: "Redeemer's University Health Centre (RUHC) | Health Management System",
    description: "Redeemer's University Health Centre (RUHC) - Comprehensive Health Management System",
    type: "website",
    images: ["/logo.jpg"],
  },
  applicationName: "RUHC HMS",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/logo.jpg" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <SpeedInsights />
        <Analytics />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Register Service Worker
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(
                    function(registration) {
                      console.log('SW registered: ', registration);
                    },
                    function(registrationError) {
                      console.log('SW registration failed: ', registrationError);
                    }
                  );
                });
              }

              // Disable zoom keyboard shortcuts (Ctrl +, Ctrl -, Ctrl 0, Ctrl scroll)
              document.addEventListener('keydown', function(e) {
                if ((e.ctrlKey || e.metaKey) && (e.key === '+' || e.key === '-' || e.key === '0' || e.key === '=')) {
                  e.preventDefault();
                }
              });

              // Disable zoom via Ctrl + scroll
              document.addEventListener('wheel', function(e) {
                if (e.ctrlKey) {
                  e.preventDefault();
                }
              }, { passive: false });

              // Disable pinch zoom on touch devices
              document.addEventListener('touchstart', function(e) {
                if (e.touches.length > 1) {
                  e.preventDefault();
                }
              }, { passive: false });
            `,
          }}
        />
      </body>
    </html>
  );
}

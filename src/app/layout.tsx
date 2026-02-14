import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  maximumScale: 1,
  userScalable: false,
  themeColor: "#1e40af",
};

export const metadata: Metadata = {
  title: "RUN Health Centre | Redeemer's University",
  description: "Redeemer's University Health Centre (RUHC), Nigeria - Comprehensive Hospital Management System for patient care, appointments, pharmacy, laboratory, and healthcare services.",
  keywords: ["RUN Health Centre", "RUHC", "Hospital Management", "Healthcare Nigeria", "Redeemer's University", "Medical", "Patient Care", "Hospital System"],
  authors: [{ name: "RUN Health Centre IT Department" }],
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
    title: "RUN Health Centre | Redeemer's University",
    description: "Redeemer's University Health Centre - Comprehensive Hospital Management System",
    type: "website",
    images: ["/logo.jpg"],
  },
  applicationName: "RUHC HMS",
  mobileWebAppCapable: true,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
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

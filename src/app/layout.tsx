import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import { ThemeProvider } from "@/lib/theme-context";
import { RealtimeProvider } from "@/lib/realtime-context";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Build version for cache invalidation
const BUILD_VERSION = process.env.NEXT_PUBLIC_BUILD_VERSION || new Date().toISOString().split('T')[0];

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
    icon: "/runlogo.jpg",
    apple: "/runlogo.jpg",
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
    images: ["/runlogo.jpg"],
  },
  applicationName: "RUHC HMS",
  other: {
    'build-version': BUILD_VERSION,
  }
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
        <link rel="apple-touch-icon" href="/runlogo.jpg" />
        <meta name="build-version" content={BUILD_VERSION} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider>
          <RealtimeProvider>
            {children}
          </RealtimeProvider>
        </ThemeProvider>
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

              // Version check on page load
              (function() {
                const storedVersion = localStorage.getItem('ruhc_build_version');
                const currentVersion = '${BUILD_VERSION}';
                
                if (storedVersion && storedVersion !== currentVersion) {
                  console.log('New version detected, clearing caches...');
                  // Clear all caches
                  if ('caches' in window) {
                    caches.keys().then(function(names) {
                      names.forEach(function(name) {
                        caches.delete(name);
                      });
                    });
                  }
                  // Clear localStorage except for user preferences
                  const theme = localStorage.getItem('ruhc_theme');
                  const timeout = localStorage.getItem('ruhc_session_timeout');
                  localStorage.clear();
                  if (theme) localStorage.setItem('ruhc_theme', theme);
                  if (timeout) localStorage.setItem('ruhc_session_timeout', timeout);
                  localStorage.setItem('ruhc_build_version', currentVersion);
                  console.log('Caches cleared for new version');
                } else {
                  localStorage.setItem('ruhc_build_version', currentVersion);
                }
              })();
            `,
          }}
        />
      </body>
    </html>
  );
}

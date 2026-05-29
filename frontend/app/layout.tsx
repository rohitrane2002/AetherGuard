import { Toaster } from "react-hot-toast";
import "./globals.css";
import StructuredData from "./components/SEO/StructuredData";

export const metadata = {
  metadataBase: new URL("https://aetherguard.vercel.app"),
  title: {
    default: "AetherGuard | AI Smart Contract Security Copilot",
    template: "%s | AetherGuard",
  },
  description: "Advanced AI-powered smart contract security audits. Detect vulnerabilities like reentrancy, flash loan attacks, and access control flaws in seconds with deep learning.",
  verification: {
    // Paste your Google Search Console verification code (from the content attribute of the HTML tag) here.
    // Example: if Google gives you <meta name="google-site-verification" content="abc123xyz" />,
    // you should paste "abc123xyz" below.
    google: "DMsEaHOGEbAOjKBeO0M7KFlPMgZWaEl0V3TYPz7-L4I",
  },
  keywords: [
    "smart contract scanner",
    "solidity vulnerability checker",
    "AI smart contract audit",
    "web3 security tool",
    "reentrancy attack checker",
    "solidity security",
    "blockchain audit",
    "defi security",
  ],
  authors: [{ name: "AetherGuard Team" }],
  creator: "AetherGuard",
  publisher: "AetherGuard",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" }
    ],
    shortcut: "/favicon.ico",
    apple: "/icon.png",
  },
  other: {
    "og:site_name": "AetherGuard AI",
  },
  openGraph: {
    title: "AetherGuard | AI Smart Contract Security Copilot",
    description: "Advanced AI-powered smart contract security audits. Detect 100+ vulnerability classes instantly.",
    url: "https://aetherguard.vercel.app",
    siteName: "AetherGuard AI",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "AetherGuard AI Security Scanner",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AetherGuard | AI Smart Contract Security",
    description: "Detect smart contract vulnerabilities in seconds with AI.",
    images: ["/og-image.png"],
    creator: "@AetherGuard",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: "https://aetherguard.vercel.app",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <StructuredData />
        {children}
        <Toaster 
          position="top-right" 
          toastOptions={{
            style: {
              background: 'rgba(15, 23, 42, 0.85)',
              color: '#f8fafc',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(139, 92, 246, 0.2)',
              boxShadow: '0 10px 40px -10px rgba(0,0,0,0.5), 0 0 20px -5px rgba(139, 92, 246, 0.1) inset',
              borderRadius: '16px',
              padding: '16px 20px',
              fontSize: '14px',
              fontWeight: 500,
              letterSpacing: '-0.3px',
              fontFamily: 'var(--font-sans)',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#022c22',
              },
              style: {
                borderColor: 'rgba(16, 185, 129, 0.3)',
                boxShadow: '0 10px 40px -10px rgba(0,0,0,0.5), 0 0 20px -5px rgba(16, 185, 129, 0.1) inset',
              }
            },
            error: {
              iconTheme: {
                primary: '#f43f5e',
                secondary: '#4c0519',
              },
              style: {
                borderColor: 'rgba(244, 63, 94, 0.3)',
                boxShadow: '0 10px 40px -10px rgba(0,0,0,0.5), 0 0 20px -5px rgba(244, 63, 94, 0.15) inset',
              }
            },
            duration: 5000,
          }}
        />
      </body>
    </html>
  );
}

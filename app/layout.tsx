import { Toaster } from "react-hot-toast";
import "./globals.css";

export const metadata = {
  title: "AetherGuard | AI Smart Contract Security Copilot",
  description: "Premium AI workspace for Solidity security reviews, live contract feedback, and audit automation.",
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

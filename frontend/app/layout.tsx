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
      </body>
    </html>
  );
}

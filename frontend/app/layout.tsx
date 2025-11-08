import "./globals.css";

export const metadata = {
  title: "AetherGuard – AI Smart Contract Auditor",
  description: "AI‑powered security analyzer for Ethereum Solidity contracts",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-aether-dark text-gray-200">
        {children}
      </body>
    </html>
  );
}
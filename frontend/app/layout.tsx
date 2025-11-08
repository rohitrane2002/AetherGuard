import "./globals.css";

export const metadata = {
  title: "AetherGuard",
  description: "AI Smart‑Contract Analyzer",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-aether-dark">
        {children}
      </body>
    </html>
  );
}
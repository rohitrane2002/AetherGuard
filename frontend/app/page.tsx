import { Metadata } from "next";
import HomePageClient from "./components/HomePageClient";

export const metadata: Metadata = {
  title: "AetherGuard | AI Smart Contract Security & Audit Tool",
  description: "The fastest AI smart contract scanner for Solidity. Detect reentrancy, access control flaws, and 100+ vulnerabilities with high accuracy. Audit your DeFi protocols instantly.",
  keywords: [
    "smart contract scanner",
    "solidity vulnerability checker",
    "AI smart contract audit",
    "web3 security tool",
    "reentrancy attack checker",
    "blockchain security scanner",
    "defi audit tool",
    "ethereum contract security"
  ],
  openGraph: {
    title: "AetherGuard | AI Smart Contract Security & Audit Tool",
    description: "Scan your smart contracts for vulnerabilities in seconds using advanced AI. Trusted by developers for deep security analysis.",
    images: ["/og-home.png"],
  },
};

export default function Home() {
  return <HomePageClient />;
}

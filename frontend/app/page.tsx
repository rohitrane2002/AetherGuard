import { Metadata } from "next";
import HomePageClient from "./components/HomePageClient";

export const metadata: Metadata = {
  title: "AetherGuard — AI Smart Contract Security Platform",
  description: "AI-native smart contract security platform for Solidity and Web3 protocols. Detect vulnerabilities, analyze contracts, and secure deployments with advanced AI scanning.",
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
    title: "AetherGuard — AI Smart Contract Security Platform",
    description: "AI-native smart contract security platform for Solidity and Web3 protocols. Detect vulnerabilities, analyze contracts, and secure deployments with advanced AI scanning.",
    images: ["/og-home.png"],
  },
};

export default function Home() {
  return <HomePageClient />;
}

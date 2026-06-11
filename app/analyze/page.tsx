import { Metadata } from "next";
import AnalyzePageClient from "../components/AnalyzePageClient";

export const metadata: Metadata = {
  title: "AI Smart Contract Scanner — AetherGuard Security Workspace",
  description: "Real-time AI security scanner for Solidity smart contracts. Detect 100+ vulnerability classes, get line-level risk insights, and generate secure code fixes instantly.",
  keywords: [
    "AI smart contract scanner",
    "solidity vulnerability detector",
    "real-time contract audit",
    "AI security copilot",
    "smart contract debugger",
    "automated solidity audit",
    "web3 security workspace",
  ],
  openGraph: {
    title: "AI Smart Contract Scanner — AetherGuard Security Workspace",
    description: "Scan your smart contracts for vulnerabilities in seconds using advanced AI. Get instant fixes and deep security insights.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "https://aetherguard.ai/analyze",
  },
};

export default function AnalyzePage() {
  return <AnalyzePageClient />;
}

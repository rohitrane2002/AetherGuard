import React from "react";

export default function StructuredData() {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "AetherGuard",
    "url": "https://aetherguard.ai",
    "logo": "https://aetherguard.ai/logo.png",
    "sameAs": [
      "https://x.com/aetherguardos?s=21",
      "https://github.com/AetherGuard"
    ],
    "description": "AI-native smart contract security platform for Solidity and Web3 protocols."
  };

  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "AetherGuard",
    "operatingSystem": "Web",
    "applicationCategory": "SecurityApplication",
    "description": "AI-native smart contract security platform for Solidity and Web3 protocols.",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "ratingCount": "1240"
    }
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "AetherGuard",
    "alternateName": "AetherGuard AI",
    "url": "https://aetherguard.ai",
    "description": "AI-native smart contract security platform for Solidity and Web3 protocols. Detect vulnerabilities, analyze contracts, and secure deployments with advanced AI scanning.",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://aetherguard.ai/analyze?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
    </>
  );
}

/* 
 ────────────────────────────────────────────────────────────────
 🔧  Tailwind CSS Configuration for AetherGuard Frontend
     ‑ Disables modern oklab() / color‑mix() CSS functions
     ‑ Prevents html2canvas PDF export color errors
 ────────────────────────────────────────────────────────────────
*/
process.env.TAILWIND_DISABLE_COLOR_FUNCTIONS = "true";

/** @type {import('tailwindcss').Config} */
module.exports = {
  /* ✅  tell Tailwind where to look for class names */
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}"
  ],

  /* ✅  theme customisation */
  theme: {
    extend: {
      colors: {
        "aether-dark": "#0d1117",
        "aether-accent": "#d946ef",
        "aether-cyan": "#06b6d4",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui"],
      },
      boxShadow: {
        glow: "0 0 20px rgba(217,70,239,0.5)",
      },
    },
  },

  /* ✅  plugins section (keep empty unless you add forms/typography later) */
  plugins: [],
};
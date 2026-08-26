/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        midnight: "#10131C",
        velvet:   "#1B2030",
        gold:     "#E8B23D",
        stub:     "#C1443D",
        cream:    "#F4EFE3",
        smoke:    "#8B93A6",
      },
      fontFamily: {
        display: ["Anton", "sans-serif"],
        body:    ["Inter", "sans-serif"],
        mono:    ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};

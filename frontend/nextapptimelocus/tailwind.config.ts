import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Adding brand-specific colors for TimeLocus
        brand: {
          pink: "#ff0080",
          cyan: "#00ffff",
          yellow: "#ffff00",
          purple: "#6366f1",
        },
      },
      animation: {
        // Smooth glow pulsing for card borders
        'glow-pulse': 'glow 3s infinite alternate',
        // Spinning loader for your submit buttons
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(99, 102, 241, 0.2)' },
          '100%': { boxShadow: '0 0 20px rgba(99, 102, 241, 0.6)' },
        },
      },
      backgroundImage: {
        // Custom gradient for that "Cyberpunk" look
        'cyber-gradient': 'linear-gradient(to right, #ff0080, #00ffff)',
      },
    },
  },
  plugins: [],
};

export default config;

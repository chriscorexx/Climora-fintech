import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        fin: {
          bg: 'rgb(var(--fin-bg) / <alpha-value>)',
          card: 'rgb(var(--fin-card) / <alpha-value>)',
          elevated: 'rgb(var(--fin-elevated) / <alpha-value>)',
          inset: 'rgb(var(--fin-inset) / <alpha-value>)',
          sunken: 'rgb(var(--fin-sunken) / <alpha-value>)',
          border: 'rgb(var(--fin-border) / <alpha-value>)',
          hover: 'rgb(var(--fin-hover) / <alpha-value>)',
          muted: 'rgb(var(--fin-muted) / <alpha-value>)',
          text: 'rgb(var(--fin-text) / <alpha-value>)',
          secondary: 'rgb(var(--fin-secondary) / <alpha-value>)',
        },
        risk: {
          low: '#10B981',      // Emerald
          moderate: '#F59E0B', // Amber
          high: '#F97316',     // Orange
          severe: '#EF4444',   // Rose
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Courier New', 'monospace'],
      },
      boxShadow: {
        'fin-card': '0 4px 20px -2px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)',
        'fin-elevated': '0 10px 30px -5px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.08)',
      }
    },
  },
  plugins: [],
};

export default config;

// tailwind.config.ts
import type { Config } from 'tailwindcss';
import forms from '@tailwindcss/forms';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    // add any other folders (e.g. ./sections, ./modules) if you keep components there
    './sections/**/*.{js,ts,jsx,tsx,mdx}',
    './modules/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // Add any custom grids / sizes you need
      gridTemplateColumns: {
        '13': 'repeat(13, minmax(0, 1fr))',
      },

      // Map design tokens (CSS vars) into Tailwind color utilities
      colors: {
        // primary/brand alias (uses the CSS variable --brand)
        primary: 'hsl(var(--primary) / <alpha-value>)',
        brand: 'hsl(var(--brand) / <alpha-value>)',
        'brand-fg': 'hsl(var(--brand-fg) / <alpha-value>)',

        // accent (alias to brand if you prefer)
        accent: 'hsl(var(--accent) / <alpha-value>)',
        'accent-foreground': 'hsl(var(--accent-foreground) / <alpha-value>)',

        // foreground/background tokens
        background: 'hsl(var(--background) / <alpha-value>)',
        foreground: 'hsl(var(--foreground) / <alpha-value>)',
        muted: 'hsl(var(--muted) / <alpha-value>)',
        'muted-foreground': 'hsl(var(--muted-foreground) / <alpha-value>)',

        // surfaces / cards
        surface: 'hsl(var(--surface) / <alpha-value>)',
        'surface-2': 'hsl(var(--surface-2) / <alpha-value>)',
        'surface-3': 'hsl(var(--surface-3) / <alpha-value>)',

        // card aliases your components may expect
        card: 'hsl(var(--card) / <alpha-value>)',
        'card-foreground': 'hsl(var(--card-foreground, var(--card-fg)) / <alpha-value>)',

        // status colors
        danger: 'hsl(var(--danger) / <alpha-value>)',
        success: 'hsl(var(--success) / <alpha-value>)',
        warning: 'hsl(var(--warning) / <alpha-value>)',

        // border token
        border: 'hsl(var(--border) / <alpha-value>)',
      },

      // you can extend shadows here if needed
      boxShadow: {
        // subtle card shadow similar to "5px around"
        'card-sm': '0 4px 10px rgba(2,6,23,0.06), 0 1px 2px rgba(2,6,23,0.04)',
        // slightly larger
        'card-md': '0 8px 24px rgba(2,6,23,0.08), 0 2px 4px rgba(2,6,23,0.04)',
      },

      // any other custom theme values...
    },

    // keep your keyframes inside extend if desired
    keyframes: {
      shimmer: {
        '100%': { transform: 'translateX(100%)' },
      },
    },
  },
  plugins: [forms],
};

export default config;

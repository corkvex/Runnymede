/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'theme-base': 'rgb(var(--color-base) / <alpha-value>)',
        'theme-surface': 'rgb(var(--color-surface) / <alpha-value>)',
        'theme-elevated': 'rgb(var(--color-elevated) / <alpha-value>)',
        'theme-hover': 'rgb(var(--color-hover) / <alpha-value>)',
        'theme-border': 'rgb(var(--color-border) / <alpha-value>)',
        'theme-input-border': 'rgb(var(--color-input-border) / <alpha-value>)',
        'theme-text': 'rgb(var(--color-text) / <alpha-value>)',
        'theme-text-2': 'rgb(var(--color-text-2) / <alpha-value>)',
        'theme-text-3': 'rgb(var(--color-text-3) / <alpha-value>)',
        'theme-active': 'rgb(var(--color-active) / <alpha-value>)',
        'theme-active-fg': 'rgb(var(--color-active-fg) / <alpha-value>)',
        'theme-input': 'rgb(var(--color-input) / <alpha-value>)',
        'grad-from': 'rgb(var(--color-grad-from) / <alpha-value>)',
        'grad-via': 'rgb(var(--color-grad-via) / <alpha-value>)',
      },
    },
  },
  plugins: [],
};

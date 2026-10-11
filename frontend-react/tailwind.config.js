/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        pine: { DEFAULT: '#24382E', light: '#33513F', dark: '#1A2820' },
        brass: { DEFAULT: '#B8862E', light: '#D9A94A', dark: '#97701F' },
        paper: { DEFAULT: '#F6F3EB', dim: '#ECE7D9' },
        ink: { DEFAULT: '#201C16', soft: '#56503F' },
        line: '#D8D0BC',
        danger: '#A23B2E',
      },
      fontFamily: {
        display: ['"Source Serif 4"', 'Georgia', 'serif'],
        sans: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(32,28,22,0.05), 0 8px 24px -12px rgba(32,28,22,0.18)',
      },
    },
  },
  plugins: [],
};

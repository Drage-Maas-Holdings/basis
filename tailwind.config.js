/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'media',
  theme: {
    extend: {
      colors: {
        'bg-base': 'var(--bg-base)',
        'bg-surface': 'var(--bg-surface)',
        'bg-surface-2': 'var(--bg-surface-2)',
        border: 'var(--border)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-muted': 'var(--text-muted)',
        'brand-navy': 'var(--brand-navy)',
        'brand-blue': 'var(--brand-blue)',
        'brand-teal': 'var(--brand-teal)',
        'brand-orange': 'var(--brand-orange)',
        'win-bg': 'var(--win-bg)',
        'win-text': 'var(--win-text)',
        'loss-bg': 'var(--loss-bg)',
        'loss-text': 'var(--loss-text)',
        'pending-bg': 'var(--pending-bg)',
        'pending-text': 'var(--pending-text)',
      },
      fontFamily: {
        display: ['"DM Serif Display"', 'Georgia', 'serif'],
        body: ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        card: 'var(--shadow-card)',
        fab: 'var(--shadow-fab)',
      },
    },
  },
  plugins: [],
}

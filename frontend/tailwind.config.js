/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Manrope"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
      },
      colors: {
        // Deep space base — the aurora sits on top of this, never a flat black.
        // CSS-variable driven so it flips to a light surface in light mode
        // (see src/styles/index.css) without changing dark mode at all.
        void: {
          950: 'rgb(var(--void-950) / <alpha-value>)',
          900: 'rgb(var(--void-900) / <alpha-value>)',
          800: 'rgb(var(--void-800) / <alpha-value>)',
          700: 'rgb(var(--void-700) / <alpha-value>)',
        },
        // The "glass tint" color: white in dark mode (identical to today — every
        // bg-frost/[x]/border-frost/x used to be bg-white/[x]/border-white/x), a dark
        // navy tint in light mode, so translucent glass surfaces stay visible instead
        // of vanishing into a white-on-white page.
        frost: 'rgb(var(--frost) / <alpha-value>)',
        // Text/border scale that mirrors Tailwind's own `slate` numerically, but is
        // CSS-variable driven so it inverts brightness in light mode (100 <-> 900,
        // etc.) — existing `slate-*` usages across the app were renamed to `ink-*`
        // for this reason; `slate` itself is untouched and still available.
        ink: {
          50: 'rgb(var(--ink-50) / <alpha-value>)',
          100: 'rgb(var(--ink-100) / <alpha-value>)',
          200: 'rgb(var(--ink-200) / <alpha-value>)',
          300: 'rgb(var(--ink-300) / <alpha-value>)',
          400: 'rgb(var(--ink-400) / <alpha-value>)',
          500: 'rgb(var(--ink-500) / <alpha-value>)',
          600: 'rgb(var(--ink-600) / <alpha-value>)',
          700: 'rgb(var(--ink-700) / <alpha-value>)',
          800: 'rgb(var(--ink-800) / <alpha-value>)',
          900: 'rgb(var(--ink-900) / <alpha-value>)',
          950: 'rgb(var(--ink-950) / <alpha-value>)',
        },
        // Aurora accent trio — violet is primary, cyan is secondary, used sparingly together.
        // CSS-variable driven: identical to today in dark mode, but darkened/more
        // saturated in light mode so this same color used as plain text (icons,
        // labels, links) stays readable against a light page instead of washing out.
        aurora: {
          violet: 'rgb(var(--aurora-violet) / <alpha-value>)',
          cyan: 'rgb(var(--aurora-cyan) / <alpha-value>)',
          rose: 'rgb(var(--aurora-rose) / <alpha-value>)',
        },
        // Status language used consistently across every screen. Same CSS-variable
        // approach as `aurora` above, for the same reason.
        status: {
          approved: 'rgb(var(--status-approved) / <alpha-value>)',
          pending: 'rgb(var(--status-pending) / <alpha-value>)',
          rejected: 'rgb(var(--status-rejected) / <alpha-value>)',
          advance: 'rgb(var(--status-advance) / <alpha-value>)',
          info: 'rgb(var(--status-info) / <alpha-value>)',
        },
        glass: {
          border: 'rgba(255,255,255,0.10)',
          fill: 'rgba(255,255,255,0.055)',
          fillStrong: 'rgba(255,255,255,0.09)',
        },
        // HR & Manager Emerald Palette
        hr: {
          emerald: '#10B981',
          teal: '#14B8A6',
          mint: '#34D399',
          deep: '#041312',
          card: 'rgba(16, 185, 129, 0.04)',
          border: 'rgba(16, 185, 129, 0.18)',
        },
        // Admin Sapphire & Indigo Palette
        admin: {
          sapphire: '#4F46E5',
          indigo: '#6366F1',
          amber: '#F59E0B',
          deep: '#050A18',
          card: 'rgba(99, 102, 241, 0.05)',
          border: 'rgba(99, 102, 241, 0.20)',
        },
        // Premium enterprise login palette — deeper navy base + purple/cyan ambient lighting.
        premium: {
          bg0: '#050816',
          bg1: '#070B18',
          bg2: '#080C1C',
          bg3: '#0A1024',
          bg4: '#0B1028',
          purple: '#6D4AFF',
          violet: '#8B5CF6',
          indigo: '#6366F1',
          cyan: '#22D3EE',
          text: '#F8FAFC',
          textSecondary: '#CBD5E1',
          textMuted: '#94A3B8',
          textFaint: '#64748B',
        },
      },
      backdropBlur: { xs: '2px' },
      boxShadow: {
        glass: '0 8px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06)',
        glow: '0 0 40px rgba(139,109,255,0.25)',
        'glow-hr': '0 0 40px rgba(16,185,129,0.25)',
        'glow-admin': '0 0 40px rgba(99,102,241,0.28)',
        'premium-card': '0 30px 90px rgba(0,0,0,0.50)',
        'premium-dashboard': '0 30px 80px rgba(0,0,0,0.5)',
        'premium-btn': '0 10px 35px rgba(109,76,255,0.35)',
        'premium-btn-hover': '0 14px 42px rgba(109,76,255,0.48)',
        'hr-btn': '0 8px 28px rgba(16,185,129,0.35)',
        'admin-btn': '0 8px 28px rgba(99,102,241,0.35)',
      },
      borderRadius: { '2xl': '1.25rem', '3xl': '1.75rem' },
      keyframes: {
        'ambient-drift': {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '50%': { transform: 'translate(-2%, 2%) scale(1.05)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'float-slow': {
          '0%, 100%': { transform: 'translateY(0) rotate(var(--tw-rotate, 0deg))' },
          '50%': { transform: 'translateY(-6px) rotate(var(--tw-rotate, 0deg))' },
        },
      },
      animation: {
        'ambient-drift': 'ambient-drift 9s ease-in-out infinite',
        'ambient-drift-slow': 'ambient-drift 13s ease-in-out infinite',
        float: 'float 6s ease-in-out infinite',
        'float-slow': 'float-slow 7s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '1rem',
      screens: { '2xl': '1400px' },
    },
    extend: {
      
      fontFamily: {
        sans:    ['Plus Jakarta Sans', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Syne', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        mono:    ['JetBrains Mono', 'Fira Code', 'monospace'],
      },

      colors: {
        border:     'hsl(var(--border))',
        input:      'hsl(var(--input))',
        ring:       'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',

        primary: {
          DEFAULT:    'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
          50:  '#EEF0FE',
          100: '#DCE2FD',
          200: '#BAC5FB',
          300: '#8E9DF8',
          400: '#6474F4',
          500: '#3D5AF1',
          600: '#2640E8',
          700: '#1E34D4',
          800: '#1B2CAB',
          900: '#1A2887',
          950: '#111752',
        },

        secondary: {
          DEFAULT:    'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
          50:  '#F5F5FA',
          100: '#E8E8F2',
          200: '#D1D1E6',
          300: '#AFAFD4',
          400: '#8888BD',
          500: '#6B6BA7',
          600: '#54548C',
          700: '#434370',
          800: '#2D2D52',
          900: '#1A1A2E',
          950: '#0F0F1E',
        },

        accent: {
          DEFAULT:    'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
          50:  '#FFF3EE',
          100: '#FFE4D5',
          200: '#FFCAAA',
          300: '#FFA874',
          400: '#FF813D',
          500: '#FF6B35',
          600: '#F04A0C',
          700: '#C7370A',
          800: '#9E2E10',
          900: '#7F2910',
          950: '#451205',
        },

        success: {
          DEFAULT:    '#10B981',
          foreground: '#FFFFFF',
          50:  '#ECFDF5',
          500: '#10B981',
          600: '#059669',
        },
        warning: {
          DEFAULT:    '#F59E0B',
          foreground: '#FFFFFF',
          50:  '#FFFBEB',
          500: '#F59E0B',
        },
        destructive: {
          DEFAULT:    'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT:    'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        card: {
          DEFAULT:    'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT:    'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
      },
      
      borderRadius: {
        sm:   'calc(var(--radius) - 4px)',
        md:   'calc(var(--radius) - 2px)',
        lg:   'var(--radius)',
        xl:   'calc(var(--radius) + 2px)',
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
        '5xl': '2.5rem',
      },

      boxShadow: {
        'xs':      '0 1px 2px rgba(0,0,0,0.04)',
        'soft-sm': '0 2px 8px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)',
        'soft':    '0 4px 16px rgba(0,0,0,0.06), 0 2px 4px rgba(0,0,0,0.04)',
        'soft-lg': '0 12px 32px rgba(0,0,0,0.08), 0 4px 8px rgba(0,0,0,0.04)',
        'soft-xl': '0 20px 48px rgba(0,0,0,0.10), 0 8px 16px rgba(0,0,0,0.04)',
        'glow':    '0 0 24px rgba(61,90,241,0.18)',
        'glow-lg': '0 0 48px rgba(61,90,241,0.22)',
        'glow-accent': '0 0 24px rgba(255,107,36,0.20)',
        'inner-sm': 'inset 0 1px 2px rgba(0,0,0,0.04)',
      },

      spacing: {
        '4.5': '1.125rem',
        '13':  '3.25rem',
        '15':  '3.75rem',
        '18':  '4.5rem',
        'safe-bottom': 'env(safe-area-inset-bottom)',
      },

      keyframes: {
        'accordion-down': {
          from: { height: '0', opacity: '0' },
          to:   { height: 'var(--radix-accordion-content-height)', opacity: '1' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)', opacity: '1' },
          to:   { height: '0', opacity: '0' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(18px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.93)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
        'scale-spring': {
          '0%':   { transform: 'scale(0.88)', opacity: '0' },
          '60%':  { transform: 'scale(1.04)', opacity: '1' },
          '100%': { transform: 'scale(1)' },
        },
        'slide-in-right': {
          from: { transform: 'translateX(100%)', opacity: '0' },
          to:   { transform: 'translateX(0)', opacity: '1' },
        },
        'slide-up': {
          from: { transform: 'translateY(100%)', opacity: '0' },
          to:   { transform: 'translateY(0)', opacity: '1' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '33%':      { transform: 'translateY(-6px) rotate(1deg)' },
          '66%':      { transform: 'translateY(-3px) rotate(-1deg)' },
        },
        'pulse-ring': {
          '0%':   { boxShadow: '0 0 0 0 rgba(61,90,241,0.35)' },
          '70%':  { boxShadow: '0 0 0 10px rgba(61,90,241,0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(61,90,241,0)' },
        },
        'shimmer': {
          '0%':   { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        'ticker': {
          '0%':   { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'bounce-in': {
          '0%':   { transform: 'scale(0.3)', opacity: '0' },
          '50%':  { transform: 'scale(1.08)' },
          '70%':  { transform: 'scale(0.96)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },

      animation: {
        'accordion-down':  'accordion-down 0.22s ease-out',
        'accordion-up':    'accordion-up 0.22s ease-out',
        'fade-in':         'fade-in 0.35s ease-out forwards',
        'fade-up':         'fade-up 0.45s ease-out forwards',
        'scale-in':        'scale-in 0.3s ease-out forwards',
        'scale-spring':    'scale-spring 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards',
        'slide-in-right':  'slide-in-right 0.35s ease-out forwards',
        'slide-up':        'slide-up 0.4s ease-out forwards',
        'float':           'float 4s ease-in-out infinite',
        'pulse-ring':      'pulse-ring 2s ease-out infinite',
        'shimmer':         'shimmer 1.6s ease-in-out infinite',
        'ticker':          'ticker 18s linear infinite',
        'bounce-in':       'bounce-in 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;

import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Military Bourbon Palette
        navy: {
          950: '#050810',
          900: '#0A0F1E',
          800: '#0F1628',
          700: '#1A2035',
          600: '#232B45',
        },
        amber: {
          bourbon: '#D97706',
          light: '#F59E0B',
          dark: '#B45309',
          brass: '#C8A84B',
        },
        olive: {
          tactical: '#4D5A2E',
          light: '#6B7F42',
          dark: '#3A4422',
        },
        steel: {
          DEFAULT: '#8896B0',
          light: '#B0BDD0',
          dark: '#5A6880',
        },
      },
      fontFamily: {
        display: ['var(--font-bebas)', 'Impact', 'sans-serif'],
        body: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'tactical-grid': `linear-gradient(rgba(77,90,46,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(77,90,46,0.06) 1px, transparent 1px)`,
        'amber-glow': 'radial-gradient(ellipse at center, rgba(217,119,6,0.15) 0%, transparent 70%)',
        'navy-gradient': 'linear-gradient(135deg, #0A0F1E 0%, #1A2035 100%)',
      },
      backgroundSize: {
        'grid-40': '40px 40px',
      },
      animation: {
        'fade-up': 'fadeUp 0.6s ease-out forwards',
        'fade-in': 'fadeIn 0.4s ease-out forwards',
        'pulse-amber': 'pulseAmber 2s ease-in-out infinite',
        'march': 'march 20s linear infinite',
        'slide-up': 'slideUp 0.4s ease-out forwards',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        pulseAmber: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        march: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      boxShadow: {
        'amber-glow': '0 0 30px rgba(217,119,6,0.25)',
        'amber-glow-lg': '0 0 60px rgba(217,119,6,0.3)',
        'navy-card': '0 4px 24px rgba(0,0,0,0.4)',
        'glass': '0 8px 32px rgba(0,0,0,0.3)',
      },
    },
  },
  plugins: [],
}

export default config

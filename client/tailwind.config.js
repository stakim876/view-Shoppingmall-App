/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          base: 'var(--color-surface-base)',
          raised: 'var(--color-surface-raised)',
          sunken: 'var(--color-surface-sunken)',
          overlay: 'var(--color-surface-overlay)',
        },
      },
      textColor: {
        primary: 'var(--color-text-primary)',
        secondary: 'var(--color-text-secondary)',
        muted: 'var(--color-text-muted)',
      },
      borderColor: {
        default: 'var(--color-border-default)',
        strong: 'var(--color-border-strong)',
      },
      fontFamily: {
        sans: [
          'Inter',
          'Noto Sans KR',
          'system-ui',
          'Segoe UI',
          'Malgun Gothic',
          'Apple SD Gothic Neo',
          'sans-serif',
        ],
      },
      keyframes: {
        slideUpBlur: {
          '0%': { opacity: '0', transform: 'translateY(24px)', filter: 'blur(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)', filter: 'blur(0)' },
        },
        fadeInDelayed: {
          '0%': { opacity: '0' },
          '60%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        gradientMotion: {
          '0%, 100%': { opacity: '0.7', transform: 'scale(1)' },
          '50%': { opacity: '0.85', transform: 'scale(1.02)' },
        },
        titleGlow: {
          '0%, 100%': { filter: 'drop-shadow(0 0 20px rgba(99, 102, 241, 0.3))' },
          '50%': { filter: 'drop-shadow(0 0 28px rgba(139, 92, 246, 0.4))' },
        },
      },
      animation: {
        'slideUpBlur': 'slideUpBlur 0.8s ease-out forwards',
        'fadeInDelayed': 'fadeInDelayed 1.2s ease-out forwards',
        'gradientMotion': 'gradientMotion 4s ease-in-out infinite',
        'titleGlow': 'titleGlow 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}

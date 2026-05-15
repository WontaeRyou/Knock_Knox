import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        knox: {
          bg:        '#0A0C0F',
          surface:   '#1A1F22',
          surfaceHi: '#222A2F',
          border:    '#2A2F36',
          secure:    '#2ECC71',
          accent:    '#4F8AFE',
          warn:      '#F39C12',
          danger:    '#E74C3C',
        },
      },
      fontFamily: {
        sans: ['Noto Sans KR', 'system-ui', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;

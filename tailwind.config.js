/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        action: '#FC8A15',
        surface: '#F6F6F6',
        positive: '#1EE494',
        trust: '#009378',
        ink: {
          DEFAULT: '#14231F',
          muted: '#54655F',
        },
        line: '#E1E0DB',
        alert: '#C6482E',
        offline: 'rgba(252, 138, 21, 0.12)',
      },
      fontFamily: {
        sans: ['"Noto Sans"', '"Noto Sans Devanagari"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '8px',
        card: '8px',
        button: '8px',
      },
      minHeight: {
        touch: '56px',
      },
      minWidth: {
        touch: '56px',
      }
    },
  },
  plugins: [],
}

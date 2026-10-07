import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#fffdf7',
          100: '#fdf6e3',
          200: '#f9ecc9',
          300: '#f3dea0',
        },
        ochre: {
          50: '#fbf3e3',
          100: '#f5e3bd',
          200: '#ecc989',
          300: '#dfab54',
          400: '#cf9636',
          500: '#b87f28',
          600: '#966421',
          700: '#754d1c',
          800: '#5c3c19',
          900: '#4a3117',
        },
        ink: {
          50: '#f3f2f0',
          100: '#dfdcd6',
          200: '#b4afa5',
          300: '#827c71',
          400: '#5a554c',
          500: '#3c3832',
          600: '#2c2925',
          700: '#201e1b',
          800: '#171614',
          900: '#0f0e0d',
        },
      },
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', 'Segoe UI', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;

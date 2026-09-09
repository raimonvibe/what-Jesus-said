/** @type {import('tailwindcss').Config} */
module.exports = {
  // Light is the default. `dark:` is the dark theme (`html.theme-dark`),
  // painted over the same pastel-rainbow wave background.
  darkMode: ['selector', 'html.theme-dark'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['Merriweather', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Playfair Display', 'Georgia', 'serif'],
      },
      backgroundImage: {
        'card-pine':
          'linear-gradient(145deg, rgba(255,255,255,0.82) 0%, rgba(250,248,247,0.74) 100%)',
        'card-ocean':
          'linear-gradient(145deg, rgba(22,19,30,0.86) 0%, rgba(16,13,22,0.78) 100%)',
      },
      colors: {
        // Light theme. 50 is ink (reading text), 900 is paper — inverted
        // from the usual Tailwind scale because the default surface is light.
        pine: {
          50: '#2c2838',
          100: '#3a3548',
          200: '#4a4458',
          300: '#6b6578',
          400: '#8e8798',
          500: '#b0a9b8',
          600: '#d4cfd8',
          700: '#e8e4ec',
          800: '#f4f1f5',
          900: '#faf8f7',
        },
        // Dark theme. Cool dusk mauve, the same family as pine, so the
        // rainbow waves keep the green and the UI does not.
        ocean: {
          50: '#ebe8f2',
          100: '#ddd8e8',
          200: '#c6bed6',
          300: '#a79db8',
          400: '#8a8098',
          500: '#6c6478',
          600: '#4f475c',
          700: '#383248',
          800: '#241f30',
          900: '#16131e',
          950: '#100d16',
        },
        accent: '#f4a261',
      },
    },
  },
  plugins: [],
}

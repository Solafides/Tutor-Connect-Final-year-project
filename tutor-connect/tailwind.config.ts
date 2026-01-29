import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#39E079',
        'primary-dark': '#2ec263',
        'background-light': '#f6f8f7',
        'background-dark': '#122017',
        'text-main': '#0d121b',
        'text-sub': '#4c669a',
      },
      fontFamily: {
        sans: ['var(--font-lexend)', 'Lexend', 'sans-serif'],
        body: ['var(--font-noto)', 'Noto Sans', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
export default config

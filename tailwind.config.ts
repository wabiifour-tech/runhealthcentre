import type { Config } from 'tailwindcss'

export default {
  content: [
    "./src/app/**/*.{js,ts,tsx, mdx}",
    "./src/components/**/*.{js, ts, tsx, mdx",
  ],
  theme: {
    extend: {
    colors: {
      primary: '#059669',
    },
  },
  plugins: {},
} satisfies Config;

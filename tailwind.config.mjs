/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Space Grotesk"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        accent: {
          DEFAULT: '#1a1a1a',
          light: '#525252',
        },
        terracotta: {
          DEFAULT: '#c2703e',
          light: '#d4896a',
        },
      },
      backgroundColor: {
        surface: '#fafaf8',
      },
    },
  },
  plugins: [],
};

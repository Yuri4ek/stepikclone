// Палитра и шрифты — из брендбука (раздел 08, tailwind.config.js · theme.extend) без изменений.
// Дополнительно: night-2 и paper из tokens.css.
export default {
  theme: {
    extend: {
      colors: {
        brand: {
          blue: { DEFAULT: '#3457F0', hover: '#2641C9', 50: '#EAF0FE', 200: '#C9D5FC' },
          sky: '#7C95FF',
          night: { DEFAULT: '#0B1220', 2: '#131C30' },
          amber: { DEFAULT: '#F07A2A', text: '#B8520F', 50: '#FFF1E6' },
          ink: { DEFAULT: '#0F172A', 2: '#4A546B', 3: '#7C869C' },
          line: '#E1E6F0',
          mist: '#F4F6FB',
          paper: '#FFFFFF',
        },
        st: {
          done: { DEFAULT: '#17915A', bg: '#E4F5EC' },
          review: { DEFAULT: '#6E4FE8', bg: '#EFEBFE' },
          returned: { DEFAULT: '#B8520F', bg: '#FFF1E6' },
          failed: { DEFAULT: '#D23B3B', bg: '#FCEBEB' },
          progress: { DEFAULT: '#3457F0', bg: '#EAF0FE' },
          idle: { DEFAULT: '#5E677D', bg: '#F0F2F6' },
        },
      },
      fontFamily: {
        sans: ['Onest', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      borderRadius: { field: '8px', btn: '12px', card: '16px' },
    },
  },
}

export default {
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#3D5AFE',
          hover: '#2F4BF0',
          deep: '#1E3A8A',
          violet: '#7C4DFF',
          purple: '#A855F7',
          sky: '#40C4FF',
          crimson: '#991B1B',
          gold: '#F59E0B',
        },
        surface: {
          bg: '#F4F6FF',
          card: '#FFFFFF',
          tint: '#EEF1FF',
          border: '#E2E8F0',
        },
        content: {
          primary: '#161A33',
          secondary: '#5B6380',
        },
        status: {
          success: '#10B981',
          pending: '#F59E0B',
          error: '#EF4444',
        },
        step: {
          scratch: '#F97316',
          minecraft: '#16A34A',
          algo: '#3D5AFE',
          theory: '#8B5CF6',
        },
        role: {
          student: '#3D5AFE',
          curator: '#0EA5E9',
          admin: '#7C3AED',
        },
      },
      fontFamily: {
        sans: ['"Google Sans"', 'Roboto', 'system-ui', '-apple-system', '"Segoe UI"', 'sans-serif'],
        mono: ['"Roboto Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
    },
  },
}

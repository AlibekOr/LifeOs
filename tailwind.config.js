/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        life: {
          bg: '#09090C',
          surface: '#141419',
          border: '#2C2C35',

          primary: '#6366F1',
          accent: '#818CF8',

          text: '#FFFFFF',
          muted: '#9494A1',
          subtle: '#5F5F6B',

          orLine: '#3A3A3A',

          success: '#22C55E',
          warning: '#F59E0B',
          danger: '#EF4444',
        },
      },

      spacing: {
        'life-1': '4px',
        'life-2': '8px',
        'life-3': '12px',
        'life-4': '16px',
        'life-5': '20px',
        'life-6': '24px',
        'life-8': '32px',
        'life-10': '40px',
        'life-12': '48px',
        'life-16': '64px',
      },

      borderRadius: {
        'life-sm': '8px',
        'life-md': '12px',
        'life-lg': '16px',
        'life-xl': '20px',
        'life-2xl': '24px',
      },

      fontSize: {
        'life-display': ['36px', { lineHeight: '42px' }],
        'life-h1': ['32px', { lineHeight: '38px' }],
        'life-h2': ['24px', { lineHeight: '30px' }],
        'life-h3': ['20px', { lineHeight: '26px' }],

        'life-body-lg': ['16px', { lineHeight: '24px' }],
        'life-body': ['15px', { lineHeight: '22px' }],
        'life-body-sm': ['14px', { lineHeight: '20px' }],
        'life-caption': ['12px', { lineHeight: '16px' }],
      },

      fontFamily: {
        inter: ['Inter'],
      },
    },
  },
  plugins: [],
};

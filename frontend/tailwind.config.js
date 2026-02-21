/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  // Принудительное включение классов для динамических размеров (используется в CircularProgress)
  safelist: [
    {
      pattern: /^(h|w)-(3|4|5|6|7|8|9|10|11|12|13|14|15|16|17|18|19|20)$/,
    },
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

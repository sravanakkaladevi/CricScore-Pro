/* ── TAILWIND CONFIG (placed before tailwind script in HTML) ──
   Ensures custom colors are available as utility classes.
   This config is loaded by the CDN Tailwind via window.tailwind.config.
*/
window.tailwind = window.tailwind || {};
window.tailwind.config = {
  theme: {
    extend: {
      colors: {
        neon: '#39ff8f',
      },
      fontFamily: {
        barlow: ['Barlow Condensed', 'sans-serif'],
        inter:  ['Inter', 'sans-serif'],
      }
    }
  }
};

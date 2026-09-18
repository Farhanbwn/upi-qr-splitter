/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#0066cc",
        "primary-focus": "#0071e3",
        "primary-on-dark": "#2997ff",
        ink: "#1d1d1f",
        body: "#1d1d1f",
        "body-on-dark": "#ffffff",
        "body-muted": "#cccccc",
        "ink-muted-80": "#333333",
        "ink-muted-48": "#7a7a7a",
        "divider-soft": "#f0f0f0",
        hairline: "#e0e0e0",
        canvas: "#ffffff",
        "canvas-parchment": "#f5f5f7",
        "surface-pearl": "#fafafc",
        "surface-tile-1": "#272729",
        "surface-tile-2": "#2a2a2c",
        "surface-tile-3": "#252527",
        "surface-black": "#000000",
        "surface-chip-translucent": "rgba(210, 210, 215, 0.64)",
        "on-primary": "#ffffff",
        "on-dark": "#ffffff",
      },
      fontFamily: {
        display: ["SF Pro Display", "system-ui", "-apple-system", "sans-serif"],
        text: ["SF Pro Text", "system-ui", "-apple-system", "sans-serif"],
      },
      boxShadow: {
        'product': 'rgba(0, 0, 0, 0.22) 3px 5px 30px 0',
      },
      spacing: {
        xxs: '4px',
        xs: '8px',
        sm: '12px',
        md: '17px',
        lg: '24px',
        xl: '32px',
        xxl: '48px',
        section: '80px',
      }
    },
  },
  plugins: [],
}

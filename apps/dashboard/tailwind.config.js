/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        beacon: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
          950: "#172554",
        },
        status: {
          safe: "#22c55e",
          moving: "#f59e0b",
          assistance: "#f97316",
          urgent: "#ef4444",
          overdue: "#6b7280",
          lost: "#111827",
        },
      },
    },
  },
  plugins: [],
};

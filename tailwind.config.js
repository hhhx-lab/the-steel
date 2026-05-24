/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#f7f6ef",
        ink: "#11140f",
        muted: "#6c7169",
        acid: "#d7ff3f",
        mint: "#4bd8a1",
        ocean: "#146b7a",
        coral: "#ff6f61",
        line: "#deddd2"
      },
      boxShadow: {
        lift: "0 18px 45px rgba(17, 20, 15, 0.12)",
        button: "0 10px 22px rgba(90, 126, 10, 0.22)"
      },
      fontFamily: {
        display: ["'Arial Rounded MT Bold'", "'PingFang SC'", "sans-serif"],
        sans: ["'PingFang SC'", "'Microsoft YaHei'", "sans-serif"]
      }
    }
  },
  plugins: []
};

import type { Config } from "tailwindcss";
const config: Config = {
    content: ["./src/**/*.{ts,tsx}"],
    theme: {
        extend: {
            colors: {
                vitalink: {
                    primary: "#1D4ED8",
                    primaryLight: "#3B82F6",
                    accent: "#FF6B6B",
                    bg: "#F8FAFC",
                    text: "#0F172A"
                }
            },
            boxShadow: {
                soft: "0 1px 2px rgba(16,24,40,.06), 0 1px 3px rgba(16,24,40,.1)"
            }
        }
    },
    plugins: []
};
export default config;

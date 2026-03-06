/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "hsl(var(--background))",
                foreground: "hsl(var(--foreground))",
                primary: {
                    DEFAULT: "hsl(var(--primary))",
                    foreground: "hsl(var(--primary-foreground))",
                },
                secondary: {
                    DEFAULT: "hsl(var(--secondary))",
                    foreground: "hsl(var(--secondary-foreground))",
                },
                destructive: {
                    DEFAULT: "hsl(var(--destructive))",
                    foreground: "hsl(var(--destructive-foreground))",
                },
                muted: {
                    DEFAULT: "hsl(var(--muted))",
                    foreground: "hsl(var(--muted-foreground))",
                },
                accent: {
                    DEFAULT: "hsl(var(--accent))",
                    foreground: "hsl(var(--accent-foreground))",
                },
                card: {
                    DEFAULT: "hsl(var(--card))",
                    foreground: "hsl(var(--card-foreground))",
                },
                color1: {
                    DEFAULT: "hsl(var(--color-1))",
                    foreground: "hsl(var(--color-1-foreground))",
                },
                color2: {
                    DEFAULT: "hsl(var(--color-2))",
                    foreground: "hsl(var(--color-2-foreground))",
                },
                color3: {
                    DEFAULT: "hsl(var(--color-3))",
                    foreground: "hsl(var(--color-3-foreground))",
                },
                color4: {
                    DEFAULT: "hsl(var(--color-4))",
                    foreground: "hsl(var(--color-4-foreground))",
                },
                color5: {
                    DEFAULT: "hsl(var(--color-5))",
                    foreground: "hsl(var(--color-5-foreground))",
                },
                border: "hsl(var(--border))",
                input: "hsl(var(--input))",
                ring: "hsl(var(--ring))",
            },
        },
    },
    plugins: [],
}

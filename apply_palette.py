import os
import re

# Base mapping logic for all tailwind colors
# Pallete: color1 (lightest gray), color2 (taupe), color3 (sand), color4 (slate), color5 (charcoal)
mappings = {
    "red": "color-5",
    "rose": "color-5",
    "pink": "color-5",
    "fuchsia": "color-5",
    "purple": "color-4",
    "violet": "color-4",
    "indigo": "color-4",
    "blue": "color-4",
    "sky": "color-4",
    "cyan": "color-4",
    "teal": "color-4",
    "emerald": "color-3",
    "green": "color-3",
    "lime": "color-3",
    "yellow": "color-3",
    "amber": "color-3",
    "orange": "color-5",
    "slate": "color-5",
    "gray": "color-5",
    "zinc": "color-5",
    "neutral": "color-5",
    "stone": "color-5",
}

config_path = "tailwind.config.js"

with open(config_path, "r", encoding='utf-8') as f:
    content = f.read()

# We want to inject this inside extend: { colors: { HERE } }
color_blocks = []
for color, var_name in mappings.items():
    block = f"""
                {color}: {{
                    DEFAULT: "hsl(var(--{var_name}))",
                    50: "hsl(var(--{var_name}) / 0.1)",
                    100: "hsl(var(--{var_name}) / 0.15)",
                    200: "hsl(var(--{var_name}) / 0.25)",
                    300: "hsl(var(--{var_name}) / 0.4)",
                    400: "hsl(var(--{var_name}) / 0.6)",
                    500: "hsl(var(--{var_name}) / 0.8)",
                    600: "hsl(var(--{var_name}))",
                    700: "hsl(var(--{var_name}))",
                    800: "hsl(var(--{var_name}))",
                    900: "hsl(var(--{var_name}))",
                    950: "hsl(var(--{var_name}))",
                }},"""
    color_blocks.append(block)

all_blocks = "\n".join(color_blocks)

if "border: \"hsl(var(--border))\"," in content:
    content = content.replace("border: \"hsl(var(--border))\",", "border: \"hsl(var(--border))\"," + all_blocks)

with open(config_path, "w", encoding='utf-8') as f:
    f.write(content)
print("Updated tailwind.config.js")

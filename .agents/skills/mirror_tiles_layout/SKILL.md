---
name: mirror-tiles-layout
description: Replicate the tiles layout format, styles, colors, border styles, text alignment, and decorative accents from the Student Welcome Screen category actions (page 2ENL) to any specified target page (such as Study Mode selection page 5ENL-1020).
---

# mirror-tiles-layout Skill Instructions

When this skill is triggered (e.g., when the user asks to mirror or replicate tiles/cards style using a shortcut or prompt naming this action and a target page), follow this systematic procedure to implement exact parity.

## 1. Locate the Target Page
Identify the React component corresponding to the target page label provided by the user (e.g. `5ENL-1020` maps to `StudyMode.tsx` selection grid).

## 2. Apply Structural DOM Parity
Ensure the target page matches the exact DOM hierarchy used in `WelcomeScreen.tsx` (`data-dev-id="student-tiles-grid"`):
- **Container Wrapper**: Set `data-dev-id="student-tiles-grid"` on the parent grid wrapper.
- **Card Element Type**: Convert each card wrapper element to a `div` tag with an `onClick` handler (avoid using `<button>` because `dev-theme.css` targets cards using `div:nth-of-type(X)`).
- **Direct Child Elements**: Place exactly three siblings inside the card container in this order:
  1. **Background Blur**: `<div className="absolute -right-6 -top-6 w-24 h-24 bg-colorX-foreground rounded-full blur-2xl group-hover:bg-colorX transition-colors opacity-10 group-hover:opacity-20"></div>`
  2. **Icon Tile**: `<div className="w-12 h-12 rounded-xl bg-colorX-foreground/10 text-colorX-foreground flex items-center justify-center group-hover:scale-110 transition-transform relative z-10 shadow-sm border border-colorX-foreground/20 shrink-0">` containing the icon.
  3. **Text Content**: `<div className="relative z-10 font-medium flex-1">` containing:
     - Title: `<h2 className="text-xl font-bold mb-1">[Title Text]</h2>`
     - Description: `<p className="text-sm opacity-80 line-clamp-2">[Description Text]</p>`

## 3. Apply Colors & Themes Sequence
Map the card elements sequentially to their respective theme variables:
1. Card 1: `color2`
2. Card 2: `color4`
3. Card 3: `color5`
4. Card 4: `color3`
5. Card 5: `color2`
6. Card 6: `color4`
*(If there are more card items, loop the sequence).*

## 4. Verify the Build
Run the production build compiler to check for type correctness:
```powershell
npm.cmd run build
```

# Lumina Flashcards: Project Customization Rules

These rules ensure that layout styles, developer themes, and session states remain consistent when adding or mirroring pages within the application.

## 1. Developer Theme Selector Parity
The developer mode CSS stylesheet (`src/dev-theme.css`) targets structural elements using explicit structural selectors. When mirroring tiles or components from a source page to a target page:
- **Match HTML Tags Exactly**: If the source page selector uses `div` tags, the target page must use `div` tags (e.g. `<div onClick={...}>` instead of `<button onClick={...}>`).
- **Hierarchy and Children Order**: Maintain the exact layout structure, child element types, and order of elements:
  1. Child 1: Background accent/decoration circle (`div`)
  2. Child 2: Small icon container tile (`div`)
  3. Child 3: Text content container (`div`)
- **Developer IDs (`data-dev-id`)**: Always match the container's developer attribute (e.g., `data-dev-id="student-tiles-grid"` on the parent wrapper) so the CSS rules target both pages identically.

## 2. Session Role and State Persistence
When testing role-specific features (such as Admin, Tutor, or Learner/Student modes):
- Always persist any session role changes immediately to both the React state (`setUser`) and `localStorage` under the `'currentUser'` key.
- This prevents page refreshes and Vite Hot Module Replacement (HMR) from silently reverting the session role back to default values, which would otherwise hide role-scoped style overrides.

## 3. Mandatory Build Verification
- Always execute the production builder after updating React components or styles to confirm soundness:
  ```powershell
  npm.cmd run build
  ```

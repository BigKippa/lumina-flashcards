
# Translation Guidelines

When adding ANY new language to this application, the following rules MUST be followed:

## 1. Full UI Localization
All user interface text MUST be translated. This ensures a consistent experience across languages.
Required sections to translate in `src/locales/[lang].json`:

-   **`auth`**: All login/register screen text.
    -   *Crucial*: Ensure `auth.welcome_title`, `auth.welcome_subtitle`, and all labels are localized.
-   **`common`**: General UI elements.
    -   *Crucial*: `common.or` (Login separator), `common.profile`, `common.logout`.
-   **`roles`**: User role names.
    -   `roles.admin`, `roles.adminTutor`, `roles.adminLearner`.
-   **`nav`**: Navigation items (e.g., "Home", "Profile").
-   **`topics`**: Topic selection screen headers/subheaders.

## 2. Exceptions (Do Not Translate)
-   **Flashcard Content**: The flashcard data (English words, definitions, examples) remains in **English** as this is an English learning application.
    -   *Note*: The *interface* around the flashcards (buttons like "Flip", "Next") MUST be translated.

## 3. Implementation Steps
1.  Create `src/locales/[code].json`.
2.  Copy the structure from `src/locales/en.json`.
3.  Translate all values (except flashcard data).
4.  Register the new language in `src/components/LanguageSelector.tsx` (add to `LANGUAGES` array).
5.  Update `src/i18n.ts` if necessary (e.g., verify fallback behavior).

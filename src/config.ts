// Site switches. Change a value here, then rebuild (`npm run build` / `npm run deploy`).
// Keep this file free of imports: astro.config.mjs reads it too.

/** Every language that has a translation file in src/i18n/. */
export const LOCALES = ['en', 'id'] as const;
export type Locale = (typeof LOCALES)[number];

/** Served at "/" with no prefix. Must stay enabled below. */
export const DEFAULT_LOCALE: Locale = 'en';

/**
 * Which languages are published.
 *
 * A disabled language gets no page, no entry in the language switcher, no hreflang tag
 * and no sitemap entry, and its URLs (/id/...) redirect to "/". Its translation file is
 * kept and still type-checked, so turning it back on is just flipping this to true.
 * The switcher hides itself when only one language is enabled.
 */
export const LANGUAGES: Record<Locale, boolean> = {
    en: true,
    id: false,
};

export const ENABLED_LOCALES: Locale[] = LOCALES.filter((l) => LANGUAGES[l]);

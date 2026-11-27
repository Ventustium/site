// Locale config and lookup. The text itself lives in one JSON file per locale.
// en.json is the reference: every other locale is type-checked against its shape,
// so a missing key fails `astro check`.
import en from './en.json';
import id from './id.json';

export const locales = ['en', 'id'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';

/** Labels shown in the language switcher. */
export const localeNames: Record<Locale, string> = { en: 'EN', id: 'ID' };
/** BCP 47 tag for <html lang> and hreflang. */
export const htmlLang: Record<Locale, string> = { en: 'en', id: 'id' };
/** Open Graph locale. */
export const ogLocale: Record<Locale, string> = { en: 'en_US', id: 'id_ID' };

/** Shape of a locale file, taken from en.json. Headings are `{ lead, accent }`: the accent gets the gradient. */
export type Dict = typeof en;

const dicts: Record<Locale, Dict> = { en, id };

export function t(locale: Locale): Dict {
    return dicts[locale];
}

/** Path of the home page in a locale: "/" for the default, "/id/" otherwise. */
export function homePath(locale: Locale): string {
    return locale === defaultLocale ? '/' : `/${locale}/`;
}

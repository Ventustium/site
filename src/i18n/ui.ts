// Locale lookup. The text lives in one JSON file per locale; which ones are published is set in src/config.ts.
// en.json is the reference: every other locale is type-checked against its shape,
// so a missing key fails `astro check`.
import en from './en.json';
import id from './id.json';
import { DEFAULT_LOCALE, ENABLED_LOCALES, type Locale } from '../config';

export type { Locale };
export const defaultLocale: Locale = DEFAULT_LOCALE;
/** Published languages only (see LANGUAGES in src/config.ts). Use this for anything rendered. */
export const locales: Locale[] = ENABLED_LOCALES;

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

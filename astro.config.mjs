// @ts-check
import { writeFile } from 'node:fs/promises';
import { defineConfig } from 'astro/config';
import { DEFAULT_LOCALE, LANGUAGES, LOCALES } from './src/config.ts';

/**
 * Writes dist/_redirects (Cloudflare) after the build, so it follows LANGUAGES in src/config.ts:
 * a published language keeps its /<locale>/wallet shortcut, a hidden one redirects to "/".
 * @returns {import('astro').AstroIntegration}
 */
function cloudflareRedirects() {
    return {
        name: 'cloudflare-redirects',
        hooks: {
            'astro:build:done': async ({ dir }) => {
                const lines = [
                    '# Generated at build time by astro.config.mjs from src/config.ts. Do not edit.',
                    '# The old /wallet page is the "tip jar" scene on the home page.',
                    '/wallet  /#wallet  301',
                ];
                for (const locale of LOCALES) {
                    if (locale === DEFAULT_LOCALE) continue;
                    if (LANGUAGES[locale]) {
                        lines.push(`/${locale}/wallet  /${locale}/#wallet  301`);
                    } else {
                        // 302, not 301: the language may be switched back on later.
                        lines.push(`/${locale}  /  302`, `/${locale}/*  /  302`);
                    }
                }
                await writeFile(new URL('_redirects', dir), lines.join('\n') + '\n');
            },
        },
    };
}

export default defineConfig({
    site: 'https://ventustium.com',
    output: 'static',
    trailingSlash: 'ignore',
    // Language routing is done by the pages themselves (src/pages/[locale]/), driven by src/config.ts.
    integrations: [cloudflareRedirects()],
    // Hidden languages redirect to "/" in `astro dev` too, the way _redirects does on Cloudflare.
    // (In the build this only adds a meta-refresh page; Cloudflare's _redirects answers first.)
    redirects: Object.fromEntries(
        LOCALES.filter((l) => l !== DEFAULT_LOCALE && !LANGUAGES[l]).map((l) => [`/${l}`, { status: 302, destination: '/' }]),
    ),
});

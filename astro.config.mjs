// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
    site: 'https://ventustium.com',
    output: 'static',
    trailingSlash: 'ignore',
    i18n: {
        locales: ['en', 'id'],
        defaultLocale: 'en',
        // English stays at "/", Indonesian lives under "/id/".
        routing: { prefixDefaultLocale: false },
    },
});

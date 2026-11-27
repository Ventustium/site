// Built to dist/sitemap.xml. Lists every published language (src/config.ts) with hreflang alternates.
import type { APIRoute } from 'astro';
import { SITE_URL, UPDATED } from '../data/site';
import { homePath, htmlLang, locales } from '../i18n/ui';

export const GET: APIRoute = () => {
    const alternates = locales.length > 1
        ? [
            ...locales.map((l) => `    <xhtml:link rel="alternate" hreflang="${htmlLang[l]}" href="${SITE_URL}${homePath(l)}"/>`),
            `    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE_URL}/"/>`,
        ].join('\n')
        : '';
    const urls = locales.map((l) => [
        '  <url>',
        `    <loc>${SITE_URL}${homePath(l)}</loc>`,
        `    <lastmod>${UPDATED}</lastmod>`,
        alternates,
        '  </url>',
    ].filter(Boolean).join('\n'));
    const xml = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
        ...urls,
        '</urlset>',
        '',
    ].join('\n');
    return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};

// Facts that are the same in every language: identity, links, wallet.
// Translatable text lives in src/i18n/ui.ts.

export const SITE_URL = 'https://ventustium.com';

/** Bump when the page content changes; used in JSON-LD and the sitemap. */
export const UPDATED = '2026-11-27';

export const person = {
    name: 'Kevin Luis Linuhung',
    firstName: 'Kevin',
    lastName: 'Linuhung',
    username: 'ventustium',
    alternateNames: ['Ventustium', 'Kevin Linuhung'],
    email: 'kevin@ventustium.com',
};

export const discord = {
    username: 'ventustium',
    url: 'https://discord.com/users/228468393110405122',
};

export const stack = ['Linux', 'Docker', 'Kubernetes', 'MikroTik', 'Ruijie', 'Cloudflare', 'PHP', 'PostgreSQL', 'MySQL'];

export interface LinkCard {
    label: string;
    url: string;
    /** Adds rel="me" (identity verification for profiles you own). */
    me?: boolean;
}

export const codeLinks: LinkCard[] = [
    { label: 'github', url: 'https://github.com/ventustium', me: true },
    { label: 'gitlab', url: 'https://gitlab.com/ventustium', me: true },
];

export const playLinks: LinkCard[] = [
    { label: 'Steam', url: 'https://steamcommunity.com/id/Ventustium/' },
    { label: 'osu!', url: 'https://osu.ppy.sh/users/10358128' },
    { label: 'WebNovels TL', url: 'https://syosetu.ventustium.com/' },
];

/** "https://github.com/ventustium" -> "github.com/ventustium" */
export function displayUrl(url: string): string {
    return url.replace(/^https?:\/\//, '').replace(/\/$/, '');
}

/** Every profile, for schema.org sameAs. */
export const sameAs = [...codeLinks, ...playLinks].map((l) => l.url).concat(discord.url);

/** Featured project (the "project" scene). */
export const project = {
    name: 'Prose Realm',
    url: 'https://prose-realm.ventustium.com/',
    /** Screenshot of the home page (dark theme), 840x525 WebP. Rename it when replacing it. */
    image: '/assets/image/prose-realm-2.webp',
};

export const wallet = {
    network: 'Ethereum',
    address: '0x559047a3F42bAC5C1D65626BDFEC56807b4AcB31',
    qr: '/assets/image/wallet-eth-qr.svg',
    logo: '/assets/image/eth-logo.webp',
};

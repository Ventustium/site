# Blocking vulnerability scanners

Bots request paths like `/.env`, `/wp-login.php` or `/.git/config` on every public site. Here they hit nothing: the site is static assets, so the Worker answers `404`. They do no harm and cost nothing, because asset requests are free. But they make up most of the `4xx` count in the Worker's metrics, which hides real broken links.

A WAF custom rule on the `ventustium.com` zone blocks the common patterns before they reach the Worker. Blocked requests show up under **Security → Events** instead of in the Worker metrics.

The rule lives in the Cloudflare dashboard, not in this repo. `wrangler deploy` does not touch it.

## Finding what returns 404

The Worker metrics page shows only counts. To list the paths, query the zone analytics with the GraphQL API:

```bash
T=$(npx wrangler auth token | tail -1)
ZONE=<zone id of ventustium.com>
curl -s https://api.cloudflare.com/client/v4/graphql \
  -H "Authorization: Bearer $T" -H 'Content-Type: application/json' \
  -d '{"query":"{viewer{zones(filter:{zoneTag:\"'$ZONE'\"}){httpRequestsAdaptiveGroups(limit:100,filter:{datetime_geq:\"2026-11-26T00:00:00Z\",edgeResponseStatus:404,clientRequestHTTPHost_in:[\"ventustium.com\",\"www.ventustium.com\"]},orderBy:[count_DESC]){count dimensions{clientRequestPath userAgent}}}}}"}' \
  | jq -r '.data.viewer.zones[0].httpRequestsAdaptiveGroups[] | "\(.count)\t\(.dimensions.clientRequestPath)"'
```

Change `datetime_geq` to the start of the period you want. Two kinds of 404 are expected and need no fix:

- `/cdn-cgi/l/email-protection`: Cloudflare Email Obfuscation rewrites `mailto:` links. A bot that follows the link without running JavaScript gets a 404.
- `/sitemap.xml` in periods before the sitemap existed.

## Creating the rule

**Security → WAF → Custom rules → Create rule**, then **Edit expression** and paste one of the two expressions below. Set **Action** to `Block`.

Both versions are limited to `ventustium.com` and `www.ventustium.com`. The other subdomains (`api.`, `iot.`, `syosetu.`) may still run PHP apps, so the rule must not match them.

### Version A: works in the Expression Builder

Every condition is `URI Full` `wildcard` `<URL>`, joined with **Or**. The builder can show and edit it as plain rows. To build it by hand, add one row per line below.

```text
(http.request.full_uri wildcard r"https://ventustium.com/*.php")
or (http.request.full_uri wildcard r"https://ventustium.com/wp-*")
or (http.request.full_uri wildcard r"https://ventustium.com/.git*")
or (http.request.full_uri wildcard r"https://ventustium.com/*.env")
or (http.request.full_uri wildcard r"https://ventustium.com/*.yml")
or (http.request.full_uri wildcard r"https://ventustium.com/*.yaml")
or (http.request.full_uri wildcard r"https://ventustium.com/*.sql")
or (http.request.full_uri wildcard r"https://ventustium.com/*.bak")
or (http.request.full_uri wildcard r"https://ventustium.com/*.log")
or (http.request.full_uri wildcard r"https://ventustium.com/*.ini")
or (http.request.full_uri wildcard r"https://ventustium.com/*.py")
or (http.request.full_uri wildcard r"https://www.ventustium.com/*.php")
or (http.request.full_uri wildcard r"https://www.ventustium.com/wp-*")
or (http.request.full_uri wildcard r"https://www.ventustium.com/.git*")
or (http.request.full_uri wildcard r"https://www.ventustium.com/*.env")
or (http.request.full_uri wildcard r"https://www.ventustium.com/*.yml")
or (http.request.full_uri wildcard r"https://www.ventustium.com/*.yaml")
or (http.request.full_uri wildcard r"https://www.ventustium.com/*.sql")
or (http.request.full_uri wildcard r"https://www.ventustium.com/*.bak")
or (http.request.full_uri wildcard r"https://www.ventustium.com/*.log")
or (http.request.full_uri wildcard r"https://www.ventustium.com/*.ini")
or (http.request.full_uri wildcard r"https://www.ventustium.com/*.py")
```

How it matches:

- `wildcard` compares the whole URL, ignoring case. `*` matches anything, including `/`, so `*.env` catches `/.env`, `/config/.env` and `/app.env`, and `.git*` catches `/.git/...` and `/.github/...`.
- The full URI includes the query string, so `/x.php?a=1` is not blocked. It still gets a harmless 404.
- Each pattern is written once per host. A host wildcard such as `https://*ventustium.com/` would also match the other subdomains.

### Version B: Expression Editor only

Shorter and catches more: any dotfile except `/.well-known/`, `.toml` and `.neon` files, and URLs with a query string. It uses functions (`lower()`, `starts_with()`, `ends_with()`) and nested `and`/`or`, so the builder cannot display it. Edit it only as text.

```text
(http.host in {"ventustium.com" "www.ventustium.com"}) and (
  ends_with(lower(http.request.uri.path), ".php")
  or starts_with(lower(http.request.uri.path), "/wp-")
  or (starts_with(http.request.uri.path, "/.") and not starts_with(http.request.uri.path, "/.well-known/"))
  or http.request.uri.path contains "/.git"
  or http.request.uri.path contains "/.env"
  or ends_with(lower(http.request.uri.path), ".env")
  or ends_with(lower(http.request.uri.path), ".yml")
  or ends_with(lower(http.request.uri.path), ".yaml")
  or ends_with(lower(http.request.uri.path), ".ini")
  or ends_with(lower(http.request.uri.path), ".toml")
  or ends_with(lower(http.request.uri.path), ".sql")
  or ends_with(lower(http.request.uri.path), ".bak")
  or ends_with(lower(http.request.uri.path), ".log")
  or ends_with(lower(http.request.uri.path), ".neon")
  or ends_with(lower(http.request.uri.path), ".py")
)
```

`/.well-known/` is excluded because certificate validation and `security.txt` use it.

## Keeping the rule safe

Neither version may match a file the site serves. The site serves `.html`, `.css`, `.js`, `.png`, `.jpg`, `.webp`, `.svg`, `.ico`, `.woff2`, `.txt` and `.xml`. That is why `.js`, `.json` and `.xml` are not blocked: `/assets/js/*.js` and `/sitemap.xml` are real files.

Before you add a file with a new extension, or a dotfile, to `public/`, check it against the rule. To list the extensions in a build:

```bash
npm run build && find dist -type f | sed 's/.*\.//' | sort | uniq -c
```

Leftover 404s such as `/metrics`, `/telescope/requests` or `/__clockwork` are not worth listing. They stay harmless 404s.

# Security

## Reporting a vulnerability

Report privately through GitHub's
[security advisory form](https://github.com/ray-cj-huang/winter-watch/security/advisories/new).
Private reporting is enabled on this repository, so the report stays between
you and the maintainer until a fix is out.

Please do not open a public issue for anything exploitable.

This is a side project, not a staffed product. Expect an acknowledgement within
about a week. If something is actively being exploited, say so in the title and
it will jump the queue.

## What is worth reporting

The app has no accounts, no database, no user-submitted content and no
analytics. It reads public NOAA endpoints and renders them. That removes most
of the usual surface, so the things that genuinely matter here are:

- **`/api/refresh` abuse.** The route invalidates the cache. In production it
  requires `CRON_SECRET` as a bearer token; any way around that check is a real
  finding, since unauthenticated calls could hammer NOAA through this app.
- **Server-side request handling.** The NOAA fetchers parse remote text. A
  crafted or malformed upstream response that causes anything worse than a bad
  number — memory exhaustion, an unhandled crash loop, code execution — is
  worth reporting.
- **Dependency vulnerabilities** that are actually reachable from this code.
  A CVE in a transitive dev-only package usually is not.
- **Anything that leaks `CRON_SECRET`** or other deployment configuration.

## What is out of scope

- Missing security headers, cookie flags or TLS configuration knobs on the
  Vercel deployment that have no demonstrable impact.
- Automated scanner output with no working proof of concept.
- Wrong forecasts, wrong rankings or wrong pass data. Those are bugs or
  disagreements, not vulnerabilities — open a normal issue. See
  [`CONTRIBUTING.md`](CONTRIBUTING.md).
- Denial of service by simply sending lots of traffic to a free-tier
  deployment.

## Supported versions

`main` is the only supported version, and the deployed site tracks it. Fixes
land there rather than in backports.

# Private web access

Public hosting stays on GitHub Pages. `private-worker.mjs` retrieves the current
public build, replaces the advertising module with an always-disabled version,
and removes ad elements. No notebook contents are sent to this Worker.

Deploy as `data-playground-private` on the Workers Free plan. Protect **all
traffic**, including previews, with Cloudflare Access's owner-email policy and
One-time PIN identity provider. Attach `private.dataplayground.science` as a
custom domain after Cloudflare DNS activation. The Worker verifies the trusted
runtime `ctx.access` identity and fails closed without it. It forwards no login
headers or cookies to GitHub Pages and does not cache the private pages offline.

The private hostname Access policy must also permit only the owner email and
One-time PIN. Keep the public apex and www DNS-only and login-free.

Status (2026-09-07): Worker deployed and custom domain attached. Owner-only
email-code login succeeded. Unauthenticated requests redirect to Access. The
private Python workspace loaded the full Seoul dataset (8,760 rows / 14 columns).
Production workers.dev and preview URLs are disabled. Public GitHub HTTPS remains
available, with the new slide favicon verified byte-for-byte. DNS resolver caches
may still show old Porkbun nameservers during propagation.

Run `node tests/test_private_worker.mjs` for fail-closed authentication, owner,
method, header-leakage, ad-module, service-worker, and redirect checks. Dashboard
source is a compact equivalent of the checked-in source; deploy this source for
future changes. No advertising SDK is enabled publicly yet. Before enabling ads,
remove the public `?ads=off` convenience switch and update the consent/privacy
integration. That switch is not authentication; only the private host is protected.

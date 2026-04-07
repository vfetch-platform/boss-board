# boss-board

Static admin console for the VFetch platform. Deployed to Vercel and communicates with the backend exclusively via same-origin `/api/...` calls proxied through Vercel rewrites.

---

## Deployment (Vercel)

1. **Root Directory**: Set the Vercel project's Root Directory to `boss-board`.
2. **Build settings**: Vercel auto-detects the static site; no build command is required unless you add a build step.
3. **Environment variables** — set in the Vercel project dashboard:

   | Variable | Description |
   |---|---|
   | `BACKEND_URL` | Full URL of the deployed backend API (e.g. `https://api.example.com`). Required — Vercel will refuse to deploy without it. |

4. **Proxy config**: `vercel.ts` in this directory is the Vercel configuration file. It rewrites every `/api/:path*` request to `$BACKEND_URL/api/:path*` so the browser never makes cross-origin requests. The fallback rewrite (`/(.*)` → `/index.html`) enables client-side routing.

---

## Authentication model

The admin console is **not** protected by an API key header. Access works as follows:

1. The admin navigates to the boss-board URL and logs in with their email and password.
2. The login request hits `/api/auth/login` (proxied to the backend), which establishes the backend's auth cookies on success.
3. Subsequent requests use that same-origin session. The backend's `/api/admin/*` routes validate the authenticated admin user and require the `admin` role — no `X-Admin-Key` or similar header is used.

---

## Bootstrapping the admin account

Before the first login you need an admin user in the database. Run the following from the `api/` directory:

```bash
# Required
ADMIN_EMAIL=you@example.com \
ADMIN_PASSWORD=supersecret \
npm run admin:create
```

Optional env vars: `ADMIN_FIRST_NAME`, `ADMIN_LAST_NAME`.

The script is idempotent — re-running it refreshes the password and role without creating duplicates. See [`api/README.md`](../api/README.md) for details.

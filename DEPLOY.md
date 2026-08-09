# Deploying Commontone to Vercel with the IONOS domain

Target: **https://commontone.de**, hosted on Vercel, domain registered at IONOS,
database on Neon (already in use).

You do **not** need hosting from IONOS. Vercel hosts the site; IONOS stays the
registrar and only points DNS at Vercel. Both the Vercel Hobby plan and the SSL
certificate are free.

---

## Before you start

| Thing | Status |
|---|---|
| Neon database | ✅ already live, migrated |
| GitHub repo | ✅ `rasulkhanbayov/nationalmusicday2026` |
| Domain | ✅ commontone.de at IONOS |
| Production build | ✅ passes locally |

You'll need logins for GitHub, Vercel and IONOS.

---

## Step 1 — Push your code to GitHub

Everything from this session is still uncommitted (~58 files). Vercel deploys
from GitHub, so this has to happen first.

```powershell
git add .
git commit -m "Rebrand to Commontone, external ticketing, event redesign"
git push origin main
```

> **Check before pushing:** `.env` is gitignored, so your database URL and
> secrets stay off GitHub. Confirm with `git status` — if `.env` ever appears in
> the list, stop and do not push.

---

## Step 2 — Set the production admin password

The current `ADMIN_PASSWORD` is 11 characters. It is the **only** thing guarding
`/admin`, and the login page will be publicly reachable once deployed. Generate a
strong one now and keep it somewhere safe:

```powershell
# PowerShell — generates a 24-char random password
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 24 | % {[char]$_})
```

Use that value for `ADMIN_PASSWORD` in Step 4. Don't reuse the local one.

---

## Step 3 — Import the project into Vercel

1. Go to <https://vercel.com/signup> and sign in **with GitHub**.
2. **Add New… → Project**.
3. Find `nationalmusicday2026` and click **Import**.
4. Vercel auto-detects Next.js. Leave Framework, Build Command and Output
   Directory at their defaults — `vercel.json` already sets the build command to
   `prisma generate && next build`.
5. **Do not click Deploy yet** — add the environment variables first (Step 4).
   A deploy without `DATABASE_URL` will fail.

---

## Step 4 — Add environment variables

In the import screen (or later under **Settings → Environment Variables**), add
each of these for the **Production** environment.

### Required

| Name | Value |
|---|---|
| `DATABASE_URL` | Your Neon string — copy from local `.env`, keep `?sslmode=require` |
| `NEXT_PUBLIC_SITE_URL` | `https://commontone.de` |
| `NEXTAUTH_URL` | `https://commontone.de` |
| `NEXTAUTH_SECRET` | Copy from local `.env` (already strong), or generate a new one |
| `ADMIN_EMAIL` | `info@commontone.de` |
| `ADMIN_PASSWORD` | The strong password from Step 2 |

⚠️ **The two URLs must be `https://commontone.de`, not localhost.** Your local
`.env` has `http://localhost:3000` for both — copying those verbatim will break
admin login and generate wrong links in sitemaps and OG tags.

### Not needed right now

`STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`,
`STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`, `EMAIL_FROM`.

Tickets are sold externally, so the built-in checkout and ticket emails are
switched off. Leave these unset — add them only if you re-enable built-in
ticketing (see README).

Now click **Deploy**. First build takes 2–4 minutes. You'll get a URL like
`nationalmusicday2026.vercel.app` — open it and confirm the site works before
touching DNS.

---

## Step 5 — Add the domain in Vercel

1. Project → **Settings → Domains**.
2. Enter `commontone.de` → **Add**.
3. When asked, choose the option that also adds **`www.commontone.de`** and
   redirects it to the apex. That way both spellings work.
4. Vercel shows the exact DNS records it wants. **Keep this tab open** — you
   copy these values in Step 6. They look like:

   | Type | Name | Value |
   |---|---|---|
   | `A` | `@` | `76.76.21.21` |
   | `CNAME` | `www` | `d1d4fc829fe7bc7c.vercel-dns-017.com` |

   ⚠️ **Copy the values from your own Vercel screen — do not type the ones
   above.** The apex `A` record is usually `76.76.21.21`, but Vercel now issues
   a **project-specific CNAME** for `www` (a unique hostname like the example
   above). The older generic `cname.vercel-dns.com` still works for existing
   setups, but new projects get their own value.

---

## Step 6 — Point IONOS DNS at Vercel

1. Log in to <https://ionos.de> → **Domains & SSL** → click **commontone.de**.
2. Open the **DNS** tab.

### The A record (apex domain)

3. Find the existing `A` record for `@` (it points at an IONOS parking page).
   Click **Edit** and change its value to Vercel's IP (`76.76.21.21`).
   Set TTL to **1 hour** (or the lowest offered).
   - If there is no `A` record, use **Add record → A**, leave Host as `@`.
   - If there are *several* `A` records for `@`, delete the extras — only one.

### The CNAME record (www)

4. Find or create the `CNAME` record for `www` and set its value to **the exact
   hostname Vercel showed you** in Step 5 (e.g.
   `d1d4fc829fe7bc7c.vercel-dns-017.com`). No trailing dot needed in the IONOS UI.
   - If IONOS already has a `www` **A** record, delete it — you cannot have both
     an A and a CNAME on the same name.

### Remove conflicts

5. Delete any IONOS **redirect** or **parking/placeholder** entry on the domain.
   These silently override DNS and are the most common reason the domain keeps
   showing an IONOS page after the records look right.

6. Save.

---

## Step 7 — Wait for DNS, then verify

DNS usually propagates in 15–60 minutes; IONOS can occasionally take a few hours.

In Vercel, **Settings → Domains** will flip from *Invalid Configuration* to a
green **Valid Configuration** on its own. SSL is issued automatically right
after — no certificate to buy from IONOS.

Check from your terminal:

```powershell
nslookup commontone.de
nslookup www.commontone.de
```

The apex should return Vercel's IP. Then open:

- <https://commontone.de> — homepage, navy/gold styling
- <https://commontone.de/events> — event catalogue
- <https://commontone.de/events/national-music-day-2026> — Music Day in Azerbaijan
- <https://commontone.de/admin> — log in with your new credentials

Confirm the padlock shows a valid certificate.

---

## Step 8 — Post-launch checklist

- [ ] **Set the ticket shop URL.** Both buttons currently read *"Tickets Coming
      Soon"* because `ticketUrl` is empty. Log in at `/admin/events`, open the
      event, fill in **Ticket shop URL**, save. This is the one thing that makes
      the site actually sell.
- [ ] Verify the admin login works with the new password, and that
      `/admin/dashboard` redirects to login when signed out.
- [ ] Check the site on a phone.
- [ ] Confirm `https://commontone.de/sitemap.xml` lists the event with the real
      domain (not localhost) — proves `NEXT_PUBLIC_SITE_URL` is set correctly.

---

## How updates work from now on

Vercel redeploys automatically on every push to `main`:

```powershell
git add .
git commit -m "Describe the change"
git push
```

Live in ~2 minutes. Each deploy gets a preview URL, and **Deployments → ⋯ →
Rollback** instantly reverts to a previous version if something breaks.

Content edits (event details, ticket URL, artwork path) go through `/admin` and
take effect immediately — no deploy needed.

---

## Troubleshooting

**Build fails: "Environment variable not found: DATABASE_URL"**
The variable is missing or wasn't applied to Production. Add it under Settings →
Environment Variables, then **Redeploy** — env changes don't apply retroactively
to an existing build.

**Domain still shows an IONOS parking page**
A leftover IONOS redirect or a second `A` record. Recheck Step 6.5. Also try a
different network or incognito — your machine may have cached the old DNS.

**Admin login redirects in a loop / "Configuration" error**
`NEXTAUTH_URL` doesn't match the URL you're visiting. It must be exactly
`https://commontone.de` — no trailing slash, `https` not `http`.

**Site loads but has no styling**
Almost always a stale build. In Vercel: **Deployments → ⋯ → Redeploy**, with
"Use existing build cache" **unchecked**.

**Database connection errors under load**
Neon's free tier suspends after inactivity; the first request wakes it and can
take a few seconds. If it becomes a problem, enable connection pooling in Neon
and use the pooled connection string.

---

## Costs — read before launch

| Item | Cost |
|---|---|
| Vercel **Pro** (see below) | ~$20/month |
| SSL certificate | Free (automatic) |
| Neon free tier | Free |
| IONOS domain | What you already pay |

### ⚠️ You need the Pro plan, not Hobby

Vercel's [Fair Use Guidelines](https://vercel.com/docs/limits/fair-use-guidelines)
state plainly:

> **Hobby teams are restricted to non-commercial personal use only. All
> commercial usage of the platform requires either a Pro or Enterprise plan.**

Their definition of commercial usage explicitly includes **"advertising the sale
of a product or service"** — and even notes that *asking for donations* counts.
A site that promotes a ticketed concert and links to a paid ticket shop falls
squarely inside that, even though the payment happens on the partner's site.

**What this means practically:** you can deploy on Hobby to test everything
end to end, but upgrade to Pro before you promote the site publicly. Vercel does
enforce this, and an unexpected takedown mid-campaign would be worse than the
$20. If you're unsure how they'd classify Commontone, their support team will
confirm in writing.

Hobby is also capped at ~100 GB transfer and 5K image transformations per month
— the three JPEGs on the event page make the image cap the one to watch.

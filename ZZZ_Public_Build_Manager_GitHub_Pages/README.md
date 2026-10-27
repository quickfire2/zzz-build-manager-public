# ZZZ Build Manager — Public UID edition

This project starts without **any bundled player builds**. Visitors enter their own Zenless Zone Zero UID, and the site requests their public Enka.Network Character Showcase. If an account has a verified, public Enka profile with saved builds, the site also attempts to load those builds. All build editing remains in each visitor's browser, saved **separately per UID**.

## Host on GitHub Pages

1. Make a public GitHub repository.
2. Upload `index.html` to the repository root.
3. In **Settings → Pages**, select **Deploy from a branch**, `main`, `/(root)` and Save.
4. Your site will appear at `https://YOUR_USERNAME.github.io/REPO_NAME/`.

No user-specific JSON is in `index.html`. The supplied static data contains only ID → name definitions.

## Enable live Enka lookups

The page first tries the Enka API directly, for example:

`https://enka.network/api/zzz/uid/1234567890/`

**Cross-origin requests may be blocked by the browser** if Enka doesn't allow your GitHub Pages origin through CORS. Browser JavaScript also cannot set a custom `User-Agent` header as Enka requests for API clients. For reliable public hosting, you can set up a small **Cloudflare Worker** instead:

1. At Cloudflare, create a Worker, using the JavaScript module from `worker.js`.
2. Deploy the Worker and copy its public HTTPS URL, such as `https://my-zzz-proxy.example.workers.dev`.
3. In `index.html`, find `const ENKA_PROXY_BASE = '';` and set it to that exact URL (no slash at the end).
4. Commit the updated `index.html`. GitHub Pages will redeploy the same URL.

The Worker accepts **only public Enka UID and saved-build GET requests**. It doesn't store user builds, credentials, tokens, or sessions. Consider adding Cloudflare rate limiting if the site becomes popular. API data availability and latency are still subject to Enka's service.

## What the site supports

- Enter a UID, with `?uid=1234567890` deep-link support.
- Load the public Showcase; load public saved builds where an Enka profile permits it.
- Save builds locally **per UID**, even after reopening the browser.
- Switch UID without mixing builds.
- Adjust agent level, Mindscape, Core Skill, skills, W-Engine, disc set, main stat, and substat rolls.
- Preview approximate character stats where Enka's reference files are available.
- Export/import one account's current builds as a JSON backup.
- Start an empty local account for any UID and manually add agents, even when Enka's API is unavailable.

## Important limitations

- A UID identifies the target game account; it does **not** log the player in or establish ownership. Anyone can view public showcases. Their private browser edits don't change Enka or anyone else's data.
- Showcase results are limited to agents the account publishes. Saved builds require the Enka profile to be verified and public.
- Storage is browser-local, so clearing website data deletes edits unless they were exported. Browser edits don't sync across devices.
- Game formulas and reference files may lag behind game updates. Overall totals are estimates; temporary and 4-piece passive buffs are excluded.
- Legacy personal-editor JSON backups can be imported into this edition to migrate existing builds.

Source documentation: https://github.com/EnkaNetwork/API-docs

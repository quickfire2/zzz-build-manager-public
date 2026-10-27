/**
 * Optional, read-only CORS bridge for the public Enka.Network API.
 * Deploy as a Cloudflare Worker; paste its URL into ENKA_PROXY_BASE in index.html.
 * It cannot save builds. Browser edits always remain local to each UID.
 * Public endpoints only; no passwords, tokens or cookies.
 */
export default {
  async fetch(request) {
    const url = new URL(request.url);
    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Accept, Content-Type',
      'Vary': 'Origin'
    };
    if (request.method === 'OPTIONS') return new Response(null, {status: 204, headers: cors});
    if (request.method !== 'GET') return new Response('Method not allowed', {status: 405, headers: cors});
    // Restrict requests to Enka's documented public UID and saved-builds routes.
    const goodUid = /^\/api\/zzz\/uid\/[0-9]{8,12}\/?$/.test(url.pathname);
    const goodBuilds = /^\/api\/profile\/[A-Za-z0-9_.-]{1,64}\/hoyos\/[A-Za-z0-9_-]{1,64}\/builds\/?$/.test(url.pathname);
    if (!goodUid && !goodBuilds) return new Response('Invalid public API route', {status: 404, headers: cors});
    const target = 'https://enka.network' + url.pathname;
    try {
      const upstream = await fetch(target, {
        method: 'GET', headers: {'Accept': 'application/json', 'User-Agent': 'ZZZ-Build-Manager-Public/1.0 (Cloudflare Worker)'},
        redirect: 'follow', cf: {cacheEverything: true, cacheTtl: 90}
      });
      const headers = new Headers(cors);
      headers.set('Content-Type', upstream.headers.get('Content-Type') || 'application/json');
      headers.set('Cache-Control', 'public, max-age=90');
      return new Response(upstream.body, {status: upstream.status, headers});
    } catch (e) {
      return new Response(JSON.stringify({error: 'Enka temporarily unavailable'}), {
        status: 502, headers: {...cors, 'Content-Type': 'application/json'}
      });
    }
  }
};

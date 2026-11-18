const VERSION = '2026-11-18';
const reply = (status, data) => new Response(JSON.stringify(data), { status, headers: {
  'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer',
  'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'",
}});
const enabled = env => env.CONTACT_ENABLED === 'true' && env.LEGAL_READY === 'true' &&
  Boolean(env.TURNSTILE_SECRET && env.TURNSTILE_SITE_KEY && env.CONTACT_SIGNING_SECRET?.length >= 32 &&
    /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(env.CONTACT_RECEIVER_URL || '') &&
    /^[a-z0-9-]+$/.test(env.SITE_ID || ''));

export function validate(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
  const limits = {name: 120, email: 254, service: 200, company: 160, sector: 120, message: 4000};
  const data = {};
  for (const [key, max] of Object.entries(limits)) {
    if (input[key] != null && typeof input[key] !== 'string') return null;
    const value = (input[key] || '').trim();
    if (value.length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value)) return null;
    data[key] = value;
  }
  if (!data.name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email) || !data.message ||
      /[\r\n]/.test(data.email) || input.consent !== true || input.consentVersion !== VERSION ||
      (input.website != null && input.website !== '') ||
      typeof input.turnstileToken !== 'string' || !input.turnstileToken || input.turnstileToken.length > 2048) return null;
  return {...data, consent: {accepted: true, version: VERSION}};
}

export async function sign(secret, body) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), {name: 'HMAC', hash: 'SHA-256'}, false, ['sign']);
  return [...new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(body)))].map(x => x.toString(16).padStart(2, '0')).join('');
}

export function onRequestGet({env}) {
  return reply(200, {enabled: enabled(env), siteKey: enabled(env) ? env.TURNSTILE_SITE_KEY : null, consentVersion: VERSION});
}

export async function onRequestPost({request, env}) {
  const origin = new URL(request.url).origin;
  if (request.headers.get('Origin') !== origin) return reply(403, {ok: false, code: 'origin'});
  if (!enabled(env)) return reply(503, {ok: false, code: 'unavailable'});
  if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get('Content-Type') || '')) return reply(415, {ok: false});
  if (Number(request.headers.get('Content-Length')) > 12288) return reply(413, {ok: false});
  // Bound streamed/chunked bodies too; do not buffer an arbitrary visitor upload.
  const reader = request.body?.getReader();
  if (!reader) return reply(400, {ok: false});
  const chunks = []; let bytes = 0;
  try {
    while (true) {
      const {value, done} = await reader.read();
      if (done) break;
      bytes += value.length;
      if (bytes > 12288) { await reader.cancel(); return reply(413, {ok: false}); }
      chunks.push(value);
    }
    const all = new Uint8Array(bytes); let offset = 0;
    for (const chunk of chunks) { all.set(chunk, offset); offset += chunk.length; }
    const input = JSON.parse(new TextDecoder().decode(all));
    const data = validate(input);
    if (!data) return reply(400, {ok: false, code: 'validation'});
    let verification;
    try {
      const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST', body: new URLSearchParams({secret: env.TURNSTILE_SECRET, response: input.turnstileToken}),
        signal: AbortSignal.timeout(8000),
      });
      verification = await r.json();
    } catch { return reply(503, {ok: false, code: 'verification_unavailable'}); }
    if (!verification.success || verification.hostname !== new URL(origin).hostname || verification.action !== 'contact') {
      return reply(400, {ok: false, code: 'verification'});
    }
    const id = crypto.randomUUID();
    const payload = JSON.stringify({id, site: env.SITE_ID, timestamp: Date.now(), ...data});
    try {
      const signature = await sign(env.CONTACT_SIGNING_SECRET, payload);
      const response = await fetch(env.CONTACT_RECEIVER_URL, {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({payload, signature}), signal: AbortSignal.timeout(15000),
      });
      const result = await response.json();
      if (!response.ok || result.ok !== true || result.id !== id) throw new Error('receiver');
      return reply(200, {ok: true, reference: id});
    } catch {
      // A timeout can occur after MailApp accepted the message. Never claim it was not sent.
      return reply(503, {ok: false, code: 'delivery_unknown', reference: id});
    }
  } catch { return reply(400, {ok: false, code: 'validation'}); }
  finally { reader.releaseLock(); }
}

export function onRequestOptions() { return reply(405, {ok: false}); }

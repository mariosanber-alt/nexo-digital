import test from 'node:test';
import assert from 'node:assert/strict';
import {createHmac} from 'node:crypto';
import {onRequestGet, onRequestPost, validate, sign} from '../functions/api/contact.js';

const valid = {name: 'Cliente de prueba', email: 'test@example.com', message: 'Consulta de prueba',
  consent: true, consentVersion: '2026-11-18', turnstileToken: 'test-token', website: ''};
const env = {CONTACT_ENABLED: 'true', LEGAL_READY: 'true', TURNSTILE_SECRET: 'test-secret',
  TURNSTILE_SITE_KEY: 'test-sitekey', CONTACT_SIGNING_SECRET: 'x'.repeat(40),
  CONTACT_RECEIVER_URL: 'https://script.google.com/macros/s/TEST/exec', SITE_ID: 'test-site'};
const request = (body, headers = {}) => new Request('https://example.pages.dev/api/contact', {
  method: 'POST', headers: {Origin: 'https://example.pages.dev', 'Content-Type': 'application/json', ...headers},
  body: typeof body === 'string' ? body : JSON.stringify(body)});

test('disabled by default and while legal information is pending', async () => {
  assert.equal((await onRequestGet({env: {}}).json()).enabled, false);
  assert.equal((await onRequestGet({env: {...env, LEGAL_READY: 'false'}}).json()).enabled, false);
  assert.equal((await onRequestPost({request: request(valid), env: {}})).status, 503);
});
test('rejects foreign origins, malformed data, oversized bodies and honeypots', async () => {
  assert.equal((await onRequestPost({request: request(valid, {Origin: 'https://evil.example'}), env})).status, 403);
  assert.equal((await onRequestPost({request: request('{'), env})).status, 400);
  assert.equal((await onRequestPost({request: request('x'.repeat(13000)), env})).status, 413);
  for (const input of [{...valid, website: 'spam'}, {...valid, consent: false}, {...valid, email: 'bad\r\n@example.com'},
    {...valid, message: ''}, {...valid, message: 'x'.repeat(4001)}, {...valid, consentVersion: 'old'}, {...valid, name: {x: 1}}]) {
    assert.equal(validate(input), null);
  }
});
test('signatures match standard HMAC-SHA256', async () => {
  assert.equal(await sign(env.CONTACT_SIGNING_SECRET, 'body'), createHmac('sha256', env.CONTACT_SIGNING_SECRET).update('body').digest('hex'));
});
test('checks captcha hostname and action and signs only validated payloads', async t => {
  let calls = 0;
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    calls++;
    if (String(url).includes('siteverify')) return Response.json({success: true, hostname: 'example.pages.dev', action: 'contact'});
    const {payload, signature} = JSON.parse(options.body);
    assert.equal(signature, await sign(env.CONTACT_SIGNING_SECRET, payload));
    const data = JSON.parse(payload);
    assert.equal(data.site, 'test-site');
    assert.equal(data.recipient, undefined);
    assert.equal(data.turnstileToken, undefined);
    return Response.json({ok: true, id: data.id});
  });
  const response = await onRequestPost({request: request({...valid, recipient: 'attacker@example.com'}), env});
  assert.equal(response.status, 200);
  assert.equal((await response.json()).ok, true);
  assert.equal(calls, 2);
});
test('invalid captcha cannot reach the receiver', async t => {
  let calls = 0;
  t.mock.method(globalThis, 'fetch', async () => {calls++; return Response.json({success: true, hostname: 'other.example', action: 'contact'});});
  assert.equal((await onRequestPost({request: request(valid), env})).status, 400);
  assert.equal(calls, 1);
});
test('receiver failure never produces a false success', async t => {
  t.mock.method(globalThis, 'fetch', async url => String(url).includes('siteverify')
    ? Response.json({success: true, hostname: 'example.pages.dev', action: 'contact'}) : Response.json({ok: false}));
  const response = await onRequestPost({request: request(valid), env});
  assert.equal(response.status, 503);
  assert.equal((await response.json()).code, 'delivery_unknown');
});

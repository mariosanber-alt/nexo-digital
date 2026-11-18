import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {createHmac} from 'node:crypto';

const source = readFileSync(new URL('../deployment/google-apps-script/Code.gs', import.meta.url), 'utf8');
function receiver(quota = 100) {
  const sent = [], cache = new Map();
  const props = {CONTACT_SIGNING_SECRET: 'x'.repeat(40), CONTACT_EMAIL: 'owner@example.com', CONTACT_SITE_ID: 'test-site'};
  const context = vm.createContext({
    ContentService: {MimeType: {JSON: 'json'}, createTextOutput: text => ({setMimeType: () => JSON.parse(text)})},
    PropertiesService: {getScriptProperties: () => ({getProperty: key => props[key]})},
    Utilities: {Charset: {UTF_8: 'utf8'}, computeHmacSha256Signature: (body, key) => [...createHmac('sha256', key).update(body).digest()]},
    LockService: {getScriptLock: () => ({tryLock: () => true, hasLock: () => true, releaseLock() {}})},
    CacheService: {getScriptCache: () => ({get: key => cache.get(key), put: (key, value) => cache.set(key, value)})},
    MailApp: {getRemainingDailyQuota: () => quota, sendEmail: message => sent.push(message)},
  });
  vm.runInContext(source, context);
  return {context, sent, props};
}
const data = () => ({id: '12345678-1234-1234-1234-123456789012', timestamp: Date.now(), site: 'test-site',
  name: 'Cliente', email: 'client@example.com', company: '', sector: '', service: '', message: 'Consulta',
  consent: {accepted: true, version: '2026-11-18'}});
function event(input, secret = 'x'.repeat(40)) {
  const payload = JSON.stringify(input);
  return {postData: {contents: JSON.stringify({payload, signature: createHmac('sha256', secret).update(payload).digest('hex')})}};
}
test('receiver sends to configured recipient only and deduplicates a signed request', () => {
  const {context, sent} = receiver();
  const input = data(); input.to = 'attacker@example.com';
  assert.equal(context.doPost(event(input)).ok, true);
  assert.equal(context.doPost(event(input)).ok, true);
  assert.equal(sent.length, 1);
  assert.equal(sent[0].to, 'owner@example.com');
  assert.equal(sent[0].replyTo, 'client@example.com');
});
test('receiver rejects wrong signatures, site, expired requests, missing consent and exhausted quota', () => {
  const {context, sent} = receiver();
  assert.equal(context.doPost(event(data(), 'wrong')).ok, false);
  for (const input of [{...data(), site: 'other'}, {...data(), timestamp: Date.now() - 600000},
    {...data(), consent: null}, {...data(), email: 'invalid'}, {...data(), message: ''}]) {
    assert.equal(context.doPost(event(input)).ok, false);
  }
  assert.equal(sent.length, 0);
  const exhausted = receiver(0);
  assert.equal(exhausted.context.doPost(event(data())).ok, false);
  assert.equal(exhausted.sent.length, 0);
});

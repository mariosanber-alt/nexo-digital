/* Independent contact receiver. Never connected to the internal AI programs.
 * Script properties: CONTACT_SIGNING_SECRET (>=32 chars), CONTACT_SITE_ID,
 * CONTACT_EMAIL (fixed recipient). Use one script per website.
 */
function json_(object) {
  return ContentService.createTextOutput(JSON.stringify(object)).setMimeType(ContentService.MimeType.JSON);
}
function doGet() { return json_({ok: false}); }
function doPost(event) {
  var lock;
  try {
    if (!event || !event.postData || event.postData.contents.length > 16000) return json_({ok: false});
    var props = PropertiesService.getScriptProperties();
    var secret = props.getProperty('CONTACT_SIGNING_SECRET');
    var recipient = props.getProperty('CONTACT_EMAIL');
    var site = props.getProperty('CONTACT_SITE_ID');
    if (!secret || secret.length < 32 || !recipient || !site) return json_({ok: false});
    var envelope = JSON.parse(event.postData.contents);
    if (typeof envelope.payload !== 'string' || !/^[a-f0-9]{64}$/.test(envelope.signature || '')) return json_({ok: false});
    var expected = Utilities.computeHmacSha256Signature(envelope.payload, secret, Utilities.Charset.UTF_8)
      .map(function (b) { return ('0' + ((b + 256) % 256).toString(16)).slice(-2); }).join('');
    var mismatch = 0;
    for (var i = 0; i < 64; i++) mismatch |= expected.charCodeAt(i) ^ envelope.signature.charCodeAt(i);
    if (mismatch) return json_({ok: false});
    var data = JSON.parse(envelope.payload);
    if (data.site !== site || typeof data.timestamp !== 'number' || !isFinite(data.timestamp) ||
        Math.abs(Date.now() - data.timestamp) > 300000 || !/^[a-f0-9-]{36}$/.test(data.id || '') ||
        !data.consent || data.consent.accepted !== true || data.consent.version !== '2026-11-18') return json_({ok: false});
    var limits = {name: 120, email: 254, service: 200, company: 160, sector: 120, message: 4000};
    for (var field in limits) {
      if (typeof data[field] !== 'string' || data[field].length > limits[field] || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(data[field])) return json_({ok: false});
    }
    if (!data.name.trim() || !data.message.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) return json_({ok: false});
    lock = LockService.getScriptLock();
    if (!lock.tryLock(5000)) return json_({ok: false});
    var cache = CacheService.getScriptCache();
    if (cache.get(data.id)) return json_({ok: true, id: data.id});
    if (MailApp.getRemainingDailyQuota() < 1) return json_({ok: false});
    MailApp.sendEmail({to: recipient, replyTo: data.email, subject: 'Consulta web · ' + site,
      body: 'Referencia: ' + data.id + '\nFecha: ' + new Date(data.timestamp).toISOString() +
        '\nNombre: ' + data.name + '\nEmail: ' + data.email + '\nEmpresa: ' + data.company +
        '\nSector: ' + data.sector + '\nServicio: ' + data.service + '\n\n' + data.message +
        '\n\nInformación de privacidad aceptada: ' + data.consent.version});
    cache.put(data.id, 'accepted', 600);
    return json_({ok: true, id: data.id});
  } catch (error) {
    // Never log personal data or secret material.
    return json_({ok: false});
  } finally { if (lock && lock.hasLock()) lock.releaseLock(); }
}

/* The browser only calls its own /api/contact. No keys or local-software URLs. */
(function () {
  'use strict';
  const form = document.querySelector('[data-contact-form]');
  if (!form) return;
  const status = form.querySelector('[data-contact-status]');
  const button = form.querySelector('button[type="submit"]');
  const email = form.dataset.contactEmail;
  const fallback = document.createElement('a');
  fallback.textContent = 'Abrir mi correo con el mensaje preparado';
  fallback.hidden = true;
  status.after(fallback);
  const widget = form.querySelector('[data-contact-challenge]');
  let config = null, token = '', widgetId = null, busy = false;
  button.disabled = true;
  const field = name => form.elements.namedItem(name)?.value?.trim() || '';
  function fallbackLink() {
    const body = `Nombre: ${field('name')}\nEmail: ${field('email')}\nEmpresa: ${field('company')}\nServicio: ${field('service')}\nSector: ${field('sector')}\n\n${field('message')}`;
    fallback.href = 'mailto:' + email + '?subject=' + encodeURIComponent('Consulta desde la web') + '&body=' + encodeURIComponent(body);
    fallback.hidden = false;
  }
  function unavailable() {
    status.textContent = 'El envío directo todavía no está disponible. Puedes escribirnos por correo.';
    button.disabled = false;
    button.textContent = 'Preparar correo';
  }
  fetch('/api/contact', {headers: {Accept: 'application/json'}, signal: AbortSignal.timeout(6000)})
    .then(r => { if (!r.ok) throw new Error(); return r.json(); })
    .then(data => {
      if (!data.enabled || !data.siteKey) { unavailable(); return; }
      config = data;
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.onerror = unavailable;
      script.onload = () => {
        widgetId = window.turnstile.render(widget, {sitekey: config.siteKey, action: 'contact',
          callback: value => {token = value; button.disabled = false;},
          'expired-callback': () => {token = ''; button.disabled = true;},
          'error-callback': () => {token = ''; unavailable();},
        });
        status.textContent = 'Completa los datos y la comprobación de seguridad para enviar tu consulta.';
      };
      document.head.append(script);
    }).catch(unavailable);
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (busy || !form.reportValidity()) return;
    if (!config?.enabled || !token) { fallbackLink(); return; }
    busy = true; button.disabled = true; fallback.hidden = true;
    status.textContent = 'Enviando tu consulta…';
    try {
      const response = await fetch('/api/contact', {method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({name: field('name'), email: field('email'), company: field('company'), sector: field('sector'),
          service: field('service'), message: field('message'), website: field('website'),
          consent: form.elements.namedItem('consent').checked, consentVersion: config.consentVersion, turnstileToken: token}),
        signal: AbortSignal.timeout(28000),
      });
      const result = await response.json();
      if (!response.ok || result.ok !== true) {
        if (result.code === 'delivery_unknown') {
          status.textContent = 'No podemos confirmar la recepción. Conserva tu mensaje y consulta por correo antes de volver a enviarlo. Referencia: ' + result.reference;
        } else { status.textContent = 'No se ha podido enviar. Conservamos el texto para que puedas intentarlo de nuevo o usar el correo.'; }
        fallbackLink(); return;
      }
      status.textContent = 'Consulta aceptada para envío por correo. Referencia: ' + result.reference;
      form.reset();
    } catch {
      status.textContent = 'No podemos confirmar la recepción. Conservamos tu mensaje; puedes consultar por correo antes de repetir el envío.';
      fallbackLink();
    } finally {
      busy = false; token = ''; button.disabled = true;
      if (widgetId !== null) window.turnstile.reset(widgetId);
    }
  });
})();

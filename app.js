/* ===== DigitaNexoSpain — render desde data.js (window.SITE) ===== */
(function () {
  "use strict";
  const S = window.SITE;
  if (!S || !S.SERVICIOS) { console.error("No se pudo cargar data.js"); return; }
  const { META, CATEGORIAS, SERVICIOS } = S;

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));
  const esc = (s) => String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  const catOf = (id) => CATEGORIAS.find((c) => c.id === id);

  let filtroCategoria = "todos";
  let termino = "";

  /* ---------- marca + contacto ---------- */
  function setupMeta() {
    document.title = `${META.marca} — ${META.eslogan}`;
    $$(".brand-name").forEach((n) => { n.textContent = META.marca; });
    $("#footerTag").textContent = META.eslogan + ".";
    $("#year").textContent = META.annio || new Date().getFullYear();
    $("#emailText").textContent = META.email;
    $("#emailLink").href = "mailto:" + META.email;
    const wa = "https://wa.me/" + META.whatsapp + "?text=" + encodeURIComponent(META.whatsappTexto);
    $("#whatsappLink").href = wa;
  }

  /* ---------- hero destacado ---------- */
  function renderHero() {
    const ids = [8, 1, 24, 7, 18, 26];
    const dest = ids.map((id) => SERVICIOS.find((s) => s.id === id)).filter(Boolean);
    $("#heroList").innerHTML = dest.map((s) =>
      `<li><span class="cat-dot" style="background:${s.color}"></span>${esc(s.nombre)}<span class="price-tag">${esc(s.precio)}</span></li>`
    ).join("");
  }

  /* ---------- filtros ---------- */
  function renderFilters() {
    const cats = [{ id: "todos", nombre: "Todos", icono: "✨", color: "#4f46e5" }, ...CATEGORIAS];
    $("#filters").innerHTML = cats.map((c) =>
      `<button class="chip ${c.id === "todos" ? "active" : ""}" data-cat="${c.id}">${c.icono} ${esc(c.nombre)}</button>`
    ).join("");
    $$("#filters .chip").forEach((b) => b.addEventListener("click", () => {
      $$("#filters .chip").forEach((x) => x.classList.remove("active"));
      b.classList.add("active");
      filtroCategoria = b.dataset.cat;
      renderGrid();
    }));
  }

  /* ---------- grid ---------- */
  function filtrar() {
    return SERVICIOS.filter((s) => {
      const okCat = filtroCategoria === "todos" || s.categoria === filtroCategoria;
      const q = termino.toLowerCase();
      const okTerm = !q || [s.nombre, s.descripcion, s.cat, s.publico].join(" ").toLowerCase().includes(q);
      return okCat && okTerm;
    });
  }

  function renderGrid() {
    const lista = filtrar();
    $("#totalServicios").textContent = SERVICIOS.length;
    $("#statServicios").textContent = SERVICIOS.length;
    if (!lista.length) { $("#grid").innerHTML = ""; $("#empty").hidden = false; return; }
    $("#empty").hidden = true;
    $("#grid").innerHTML = lista.map(cardHTML).join("");
    $$("#grid .card").forEach((c) => {
      c.addEventListener("click", () => abrirModal(Number(c.dataset.id)));
      c.addEventListener("keydown", event => {
        if (event.key === "Enter" || event.key === " ") { event.preventDefault(); abrirModal(Number(c.dataset.id)); }
      });
    });
  }

  function cardHTML(s) {
    return `
      <article class="card" data-id="${s.id}" tabindex="0" role="button" aria-label="Ver detalles: ${esc(s.nombre)}">
        <div class="card-top">
          <div class="card-ico" style="background:${s.color}22">${s.icono}</div>
          <span class="card-cat">${esc(s.cat)}</span>
        </div>
        <h3>${esc(s.nombre)}</h3>
        <p>${esc(s.descripcion)}</p>
        <div class="card-foot">
          <span class="price">${esc(s.precio)}</span>
          <span class="ver">Ver detalles →</span>
        </div>
      </article>`;
  }

  /* ---------- modal (solo datos públicos) ---------- */
  let modalTrigger = null;
  function abrirModal(id) {
    const s = SERVICIOS.find((x) => x.id === id);
    if (!s) return;
    modalTrigger = document.activeElement;
    $("#modalBody").innerHTML = modalHTML(s);
    $("#modal").classList.add("open");
    $("#modal").setAttribute("aria-hidden", "false");
    $("#modal").inert = false;
    $(".modal-close").focus();
    document.body.style.overflow = "hidden";
    $("#modal").querySelector(".modal-panel").scrollTop = 0;
  }
  function cerrarModal() {
    if (modalTrigger) modalTrigger.focus();
    $("#modal").classList.remove("open");
    $("#modal").setAttribute("aria-hidden", "true");
    $("#modal").inert = true;
    document.body.style.overflow = "";
  }

  function modalHTML(s) {
    return `
      <div class="modal-head">
        <div class="modal-ico" style="background:${s.color}22">${s.icono}</div>
        <div>
          <div class="modal-cat">${esc(s.cat)}</div>
          <h2 id="serviceTitle">${esc(s.nombre)}</h2>
        </div>
      </div>
      <div class="modal-price">${esc(s.precio)}</div>
      <div class="modal-section">
        <h3>Qué es</h3>
        <p>${esc(s.descripcion)}</p>
      </div>
      <div class="modal-section">
        <h3>Para quién está enfocado</h3>
        <p>${esc(s.publico)}</p>
      </div>
      <div class="cta-row">
        <a class="btn btn-primary" href="#contacto" data-close>Solicitar este servicio</a>
        <button class="btn btn-ghost" data-close>Cerrar</button>
      </div>`;
  }

  /* ---------- tarifas ---------- */
  function precioNum(p) {
    const m = String(p).match(/(\d+)/);
    return m ? parseInt(m[1], 10) : 0;
  }
  function renderPriceBands() {
    const bands = [
      { id: "micro", ico: "🪙", label: "Servicios básicos", range: "5 – 19 €", test: (s) => { const n = precioNum(s.precio); return n > 0 && n < 20; } },
      { id: "std", ico: "📦", label: "Servicios estándar", range: "20 – 49 €", test: (s) => { const n = precioNum(s.precio); return n >= 20 && n < 50; } },
      { id: "prem", ico: "💎", label: "Servicios premium", range: "50 – 199 €", test: (s) => { const n = precioNum(s.precio); return n >= 50 && n < 200; } },
      { id: "rec", ico: "🔁", label: "Mensuales / por unidad", range: "desde 29 €/mes", test: (s) => /\/mes|mes|hora|min|reel|vídeo|video|episodio|pista|lead|%|foto|sesión/.test(s.precio) && !/^desde/.test(s.precio) },
    ];
    $("#priceBands").innerHTML = bands.map((b) => {
      const n = SERVICIOS.filter(b.test).length;
      return `<div class="band"><div class="band-ico">${b.ico}</div><h4>${b.label}</h4><div class="band-range">${b.range}</div><div class="band-count">${n} servicios</div></div>`;
    }).join("");
  }

  /* ---------- FAQ ---------- */
  const FAQ = [
    { q: "¿Cómo empiezo si nunca he contratado un servicio digital?", a: "Muy fácil: escríbenos por email o WhatsApp contándonos qué necesitas. Te proponemos el servicio adecuado y, en la mayoría de casos, una muestra gratuita para que veas la calidad antes de pagar." },
    { q: "¿Cuánto tardáis en entregar?", a: "La mayoría de servicios se entregan en 24-72 horas. Los proyectos más grandes pueden tardar hasta 5 días. Siempre te damos el plazo exacto en el presupuesto." },
    { q: "¿Cómo se paga?", a: "Aceptamos Bizum, PayPal y transferencia. En servicios de mayor importe se paga el 50% por adelantado y el resto al entregar." },
    { q: "¿Hay garantía o revisiones?", a: "Sí. Incluimos ajustes hasta que el resultado encaje con lo que necesitas. Si algo no te convence, lo corregimos sin coste adicional." },
    { q: "¿Atendéis fuera de España?", a: "Sí, trabajamos 100% online. Todos los entregables se comparten por correo o Drive." },
    { q: "¿Puedo ver un ejemplo antes de contratar?", a: "Claro. Pide una muestra gratuita del servicio que te interese y te enseñamos un ejemplo real antes de pagar." },
  ];
  function renderFAQ() {
    $("#faqList").innerHTML = FAQ.map((f, i) => `
      <div class="faq-item">
        <button class="faq-q" data-i="${i}">${esc(f.q)}<span class="chev">▾</span></button>
        <div class="faq-a">${esc(f.a)}</div>
      </div>`).join("");
    $$("#faqList .faq-q").forEach((b) => b.addEventListener("click", () => {
      const item = b.parentElement;
      const open = item.classList.contains("open");
      $$("#faqList .faq-item").forEach((x) => x.classList.remove("open"));
      if (!open) item.classList.add("open");
    }));
  }

  /* ---------- contacto ---------- */
  function renderForm() {
    const sel = $("#fServicio");
    sel.innerHTML = '<option value="">— Elige un servicio (o escríbelo en el mensaje) —</option>' +
      SERVICIOS.map((s) => `<option value="${esc(s.nombre)}">${esc(s.nombre)}</option>`).join("");
  }

  /* ---------- nav móvil ---------- */
  function setupNav() {
    $("#navToggle").addEventListener("click", () => {
      const open = $("#nav").classList.toggle("open");
      $("#navToggle").setAttribute("aria-expanded", String(open));
    });
    $$("#nav a").forEach((a) => a.addEventListener("click", () => { $("#nav").classList.remove("open"); $("#navToggle").setAttribute("aria-expanded", "false"); }));
    // Delegación: cierra el modal con CUALQUIER elemento [data-close] (estático o dinámico)
    $("#modal").addEventListener("click", (e) => {
      if (e.target.closest("[data-close]")) cerrarModal();
    });
    document.addEventListener("keydown", (e) => {
      if (!$("#modal").classList.contains("open")) return;
      if (e.key === "Escape") { e.preventDefault(); cerrarModal(); }
      if (e.key === "Tab") {
        const controls = $$("#modal button, #modal a[href]");
        const first = controls[0], last = controls[controls.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }

  /* ---------- búsqueda ---------- */
  function setupSearch() {
    let t;
    $("#searchInput").addEventListener("input", (e) => {
      clearTimeout(t);
      t = setTimeout(() => { termino = e.target.value; renderGrid(); }, 160);
    });
  }

  /* ---------- init ---------- */
  function init() {
    setupMeta();
    renderHero();
    renderFilters();
    renderGrid();
    renderPriceBands();
    renderFAQ();
    renderForm();
    setupNav();
    setupSearch();
  }
  init();
})();

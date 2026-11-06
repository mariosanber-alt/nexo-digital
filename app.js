/* ===== Nexo Digital — render desde data.js (window.SITE) ===== */
(function () {
  "use strict";
  const S = window.SITE;
  if (!S || !S.METODOS) { console.error("No se pudo cargar data.js"); return; }
  const { META, CATEGORIAS, METODOS } = S;

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
    const names = $$(".brand-name");
    names.forEach((n) => { n.innerHTML = esc(META.marca.replace(/^(.*?)([A-ZÁÉÍÓÚÑ][a-záéíóúñ]*)$/, "$1<span>$2</span>")); });
    $("#footerTag").textContent = META.eslogan + ".";
    $("#year").textContent = META.annio || new Date().getFullYear();
    $("#emailText").textContent = META.email;
    $("#emailLink").href = "mailto:" + META.email;
    const wa = "https://wa.me/" + META.whatsapp + "?text=" + encodeURIComponent(META.whatsappTexto);
    $("#whatsappLink").href = wa;
  }

  /* ---------- hero destacado ---------- */
  function renderHero() {
    const destacados = [8, 1, 24, 7, 18, 26].map((id) => METODOS.find((m) => m.id === id)).filter(Boolean);
    $("#heroList").innerHTML = destacados.map((m) => {
      const c = catOf(m.categoria);
      return `<li><span class="cat-dot" style="background:${c.color}"></span>${esc(m.nombre)}<span class="price-tag">${esc(m.precio)}</span></li>`;
    }).join("");
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
    return METODOS.filter((m) => {
      const okCat = filtroCategoria === "todos" || m.categoria === filtroCategoria;
      const q = termino.toLowerCase();
      const okTerm = !q || [m.nombre, m.resumen, m.categoria, m.cliente].join(" ").toLowerCase().includes(q);
      return okCat && okTerm;
    });
  }

  function renderGrid() {
    const lista = filtrar();
    $("#totalServicios").textContent = METODOS.length;
    $("#statServicios").textContent = METODOS.length;
    if (!lista.length) { $("#grid").innerHTML = ""; $("#empty").hidden = false; return; }
    $("#empty").hidden = true;
    $("#grid").innerHTML = lista.map(cardHTML).join("");
    $$("#grid .card").forEach((c) => c.addEventListener("click", () => abrirModal(Number(c.dataset.id))));
  }

  function cardHTML(m) {
    const c = catOf(m.categoria);
    const origen = m.origen === "deepseek"
      ? `<span class="origin-badge origin-deepseek">DeepSeek</span>`
      : `<span class="origin-badge origin-nuevo">Nuevo</span>`;
    return `
      <article class="card" data-id="${m.id}">
        ${origen}
        <div class="card-top">
          <div class="card-ico" style="background:${c.color}22">${c.icono}</div>
          <span class="card-cat">${esc(c.nombre)}</span>
        </div>
        <h3>${esc(m.nombre)}</h3>
        <p>${esc(m.resumen)}</p>
        <div class="card-foot">
          <span class="price">${esc(m.precio)}</span>
          <span class="ver">Ver detalles →</span>
        </div>
      </article>`;
  }

  /* ---------- modal ---------- */
  function abrirModal(id) {
    const m = METODOS.find((x) => x.id === id);
    if (!m) return;
    const c = catOf(m.categoria);
    $("#modalBody").innerHTML = modalHTML(m, c);
    $("#modal").classList.add("open");
    document.body.style.overflow = "hidden";
    $("#modal").querySelector(".modal-panel").scrollTop = 0;
  }
  function cerrarModal() {
    $("#modal").classList.remove("open");
    document.body.style.overflow = "";
  }

  function bloque(titulo, contenido) {
    return `<div class="modal-section"><h3>${titulo}</h3>${contenido}</div>`;
  }
  function modalHTML(m, c) {
    const origen = m.origen === "deepseek" ? "Método de la conversación con DeepSeek" : "Método nuevo (creado y verificado)";
    const pasos = `<ol>${m.pasos.map((p) => `<li>${esc(p)}</li>`).join("")}</ol>`;
    const mats = `<div class="modal-tags">${m.materiales.map((x) => `<span class="modal-tag">${esc(x)}</span>`).join("")}</div>`;
    const prompts = m.prompts && m.prompts.length
      ? m.prompts.map((p) => `<h3 style="margin-top:14px">${esc(p.titulo)}</h3><pre>${esc(p.texto)}</pre>`).join("")
      : "<p>—</p>";
    const copys = m.copys && m.copys.length
      ? m.copys.map((cp) => `<h3 style="margin-top:14px">${esc(cp.titulo)}</h3><pre>${esc(cp.texto)}</pre>`).join("")
      : "<p>—</p>";
    const codigo = m.codigo
      ? `<h3 style="margin-top:14px">Código incluido: <code class="inline">${esc(m.codigo.archivo)}</code></h3><pre>${esc(m.codigo.contenido)}</pre>`
      : "";
    const tabla = `
      <div class="modal-tags" style="margin-top:4px">
        <span class="modal-tag">⏱️ ${esc(m.tiempo)}</span>
        <span class="modal-tag">📊 ${esc(m.dificultad)}</span>
        <span class="modal-tag">💶 Primer euro: ${esc(m.primerEuro)}</span>
        <span class="modal-tag">💳 ${esc(m.cobro)}</span>
      </div>`;
    return `
      <div class="modal-head">
        <div class="modal-ico" style="background:${c.color}22">${c.icono}</div>
        <div>
          <div class="modal-cat">${esc(c.nombre)} · ${origen}</div>
          <h2>${esc(m.nombre)}</h2>
        </div>
      </div>
      <div class="modal-price">${esc(m.precio)}</div>
      ${bloque("Qué es", `<p>${esc(m.resumen)}</p>`)}
      ${bloque("Quién paga", `<p>${esc(m.cliente)}</p>`)}
      ${bloque("Datos clave", tabla)}
      ${bloque("Material necesario", mats)}
      ${bloque("Paso a paso", pasos)}
      ${bloque("Prompts listos", prompts)}
      ${bloque("Mensajes de captación", copys)}
      ${bloque("Automatización", `<p>${esc(m.automatizacion)}</p>${codigo}`)}
      ${bloque("Dónde encontrar clientes", `<p>${esc(m.clientes)}</p>`)}
      ${m.planB ? bloque("Plan B", `<p>${esc(m.planB)}</p>`) : ""}
      ${bloque("Verificación y viabilidad", `<p>${esc(m.verificacion)}</p>`)}
      <div class="cta-row">
        <a class="btn btn-primary" href="#contacto" data-close>Solicitar este servicio</a>
        <button class="btn btn-ghost" data-close>Cerrar</button>
      </div>`;
  }

  /* ---------- tarifas ---------- */
  function renderPriceBands() {
    const bands = [
      { id: "micro", ico: "🪙", label: "Micro", range: "5 – 19 €", test: (m) => m.precioBase > 0 && m.precioBase <= 19 },
      { id: "std", ico: "📦", label: "Estándar", range: "20 – 39 €", test: (m) => m.precioBase >= 20 && m.precioBase <= 39 },
      { id: "prem", ico: "💎", label: "Premium", range: "40 – 99 €", test: (m) => m.precioBase >= 40 && m.precioBase <= 99 },
      { id: "rec", ico: "🔁", label: "Recurrente / pasivo", range: "29 – 149 €/mes", test: (m) => m.precioBase === 0 || /\/mes|recurrente|royalt|ingreso|margen|comisión|CPM/i.test(m.precio) },
    ];
    $("#priceBands").innerHTML = bands.map((b) => {
      const n = METODOS.filter(b.test).length;
      return `<div class="band"><div class="band-ico">${b.ico}</div><h4>${b.label}</h4><div class="band-range">${b.range}</div><div class="band-count">${n} servicios</div></div>`;
    }).join("");
  }

  /* ---------- FAQ ---------- */
  const FAQ = [
    { q: "¿Cómo empiezo si nunca he contratado un servicio digital?", a: "Muy fácil: escríbenos por email o WhatsApp contándonos qué necesitas. Te proponemos un servicio concreto y, en la mayoría de casos, una muestra gratuita para que veas la calidad antes de pagar." },
    { q: "¿Cuánto tardáis en entregar?", a: "La mayoría de servicios se entregan en 24-72 horas. Los proyectos más grandes (pitch decks, tiendas online, SOPs) pueden tardar hasta 5 días. Siempre te damos el plazo exacto en el presupuesto." },
    { q: "¿Cómo se paga?", a: "Aceptamos Bizum, PayPal y transferencia. En servicios de mayor importe se paga el 50% por adelantado y el resto al entregar. Todo queda claro en el presupuesto antes de empezar." },
    { q: "¿Hay garantía o revisiones?", a: "Sí. Incluimos ajustes hasta que el resultado encaje con lo que necesitas. Si algo no te convence, lo corregimos sin coste adicional." },
    { q: "¿Trabajáis con IA o con personas?", a: "Con ambas: usamos IA para acelerar la producción y una persona revisa y ajusta cada entrega para garantizar calidad y que suene humano. Nada se entrega sin revisión." },
    { q: "¿Atendéis fuera de España?", a: "Sí, trabajamos 100% online. Todos los entregables se comparten por correo o Drive, y cobramos por PayPal o transferencia internacional." },
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
      METODOS.map((m) => `<option value="${esc(m.nombre)}">${esc(m.nombre)}</option>`).join("");
    $("#contactForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const nombre = $("#fNombre").value.trim();
      const email = $("#fEmail").value.trim();
      const servicio = $("#fServicio").value;
      const mensaje = $("#fMensaje").value.trim();
      const asunto = "Presupuesto — " + (servicio || "consulta general");
      const cuerpo = `Hola ${META.marca},\n\nNombre: ${nombre}\nEmail: ${email}\nServicio: ${servicio || "por definir"}\n\nMensaje:\n${mensaje}`;
      window.location.href = "mailto:" + META.email + "?subject=" + encodeURIComponent(asunto) + "&body=" + encodeURIComponent(cuerpo);
    });
  }

  /* ---------- nav móvil ---------- */
  function setupNav() {
    $("#navToggle").addEventListener("click", () => $("#nav").classList.toggle("open"));
    $$("#nav a").forEach((a) => a.addEventListener("click", () => $("#nav").classList.remove("open")));
    $$("#modal [data-close]").forEach((el) => el.addEventListener("click", cerrarModal));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") cerrarModal(); });
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

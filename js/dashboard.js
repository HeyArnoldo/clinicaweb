/* ============================================================
   ClinicaWeb — Panel de indicadores (dashboard)
   Everything here is computed live from the parallel arrays in
   data.js. Showcases rubric items 5 (events/functions), 6
   (parallel arrays + array functions: map/filter/reduce/sort/slice)
   and 8 (DOM manipulation: build KPIs, bar chart, donut, rankings).
   ============================================================ */
(function () {
  "use strict";

  const { qs, el, formatSoles } = window.ClinicaUI;
  const esp = window.CLINICA.especialidades;
  const med = window.CLINICA.medicos;
  const { estadoLabel } = window.CLINICA;

  if (!esp || !med || !qs("#kpi-grid")) return;

  // --- UI state driven by the controls ---
  let convenioFilter = "";
  let sortDir = "desc";

  const selConvenio = qs("#dash-convenio");
  const selSort = qs("#dash-sort");

  // Indices of the specialties that pass the current convenio filter,
  // sorted by price. Keeping indices keeps the parallel arrays aligned.
  function activeIndices() {
    let idx = esp.key.map((_, i) => i);
    if (convenioFilter) idx = idx.filter((i) => esp.convenioTipo[i] === convenioFilter);
    idx.sort((a, b) =>
      sortDir === "asc" ? esp.precio[a] - esp.precio[b] : esp.precio[b] - esp.precio[a]
    );
    return idx;
  }

  /* ---- 01 · KPI cards ---- */
  function renderKPIs() {
    const idx = activeIndices();
    const prices = idx.map((i) => esp.precio[i]);
    const totalMed = med.nombres.length;
    const disponibles = med.estado.filter((e) => e === "disponible").length;
    const avg = prices.length
      ? Math.round(prices.reduce((sum, p) => sum + p, 0) / prices.length)
      : 0;
    const ingreso = prices.reduce((sum, p) => sum + p, 0);

    const kpis = [
      { label: "Médicos", value: String(totalMed), note: disponibles + " disponibles hoy" },
      { label: "Especialidades", value: String(idx.length), note: "de " + esp.key.length + " en catálogo" },
      { label: "Precio promedio", value: formatSoles(avg), note: "consulta filtrada" },
      { label: "Ingreso potencial", value: formatSoles(ingreso), note: "una consulta por especialidad" }
    ];

    const grid = qs("#kpi-grid");
    grid.innerHTML = "";
    kpis.forEach((k) => {
      const card = el("article", { class: "tile tile--stat", role: "listitem" });
      card.appendChild(el("div", { class: "kicker", text: k.label }));
      card.appendChild(el("div", { class: "tile__num--big", text: k.value }));
      card.appendChild(el("p", { text: k.note }));
      grid.appendChild(card);
    });

    qs("#kpi-context").textContent =
      convenioFilter ? "Filtro: " + labelConvenio(convenioFilter) : "Sin filtro de convenio";
  }

  function labelConvenio(tipo) {
    return { ambos: "EsSalud · SIS", essalud: "Solo EsSalud", particular: "Particular" }[tipo] || tipo;
  }

  /* ---- 02 · Bar chart (precio por especialidad) ---- */
  function renderBars() {
    const idx = activeIndices();
    const chart = qs("#bar-chart");
    chart.innerHTML = "";

    const maxPrice = idx.reduce((max, i) => Math.max(max, esp.precio[i]), 0) || 1;

    idx.forEach((i) => {
      const row = el("div", { class: "bar-row" });
      row.appendChild(el("span", { class: "bar-row__label", text: esp.nombre[i] }));

      const track = el("div", { class: "bar-row__track" });
      const fill = el("div", { class: "bar-row__fill" });
      fill.style.width = "0%"; // animate from 0 to target on next frame
      track.appendChild(fill);
      row.appendChild(track);
      row.appendChild(el("span", { class: "bar-row__value", text: formatSoles(esp.precio[i]) }));
      chart.appendChild(row);

      const target = Math.round((esp.precio[i] / maxPrice) * 100);
      window.requestAnimationFrame(() => { fill.style.width = target + "%"; });
    });

    qs("#bar-count").textContent = idx.length + " especialidades";
  }

  /* ---- 03 · Donut: médicos por estado ---- */
  function renderDonut() {
    const estados = ["disponible", "ocupado", "vacaciones"];
    const colors = {
      disponible: "var(--accent)",
      ocupado: "var(--info)",
      vacaciones: "var(--muted-soft)"
    };
    const total = med.estado.length;
    const counts = estados.map((e) => med.estado.filter((x) => x === e).length);

    // Build the conic-gradient stops cumulatively.
    let acc = 0;
    const stops = estados.map((e, k) => {
      const start = (acc / total) * 100;
      acc += counts[k];
      const end = (acc / total) * 100;
      return colors[e] + " " + start + "% " + end + "%";
    });
    qs("#donut").style.background = "conic-gradient(" + stops.join(", ") + ")";

    const legend = qs("#donut-legend");
    legend.innerHTML = "";
    estados.forEach((e, k) => {
      const pct = Math.round((counts[k] / total) * 100);
      const li = el("li", { class: "donut-legend__item" });
      const dot = el("span", { class: "donut-legend__dot" });
      dot.style.background = colors[e];
      li.appendChild(dot);
      li.appendChild(el("span", { class: "donut-legend__label", text: estadoLabel[e] }));
      li.appendChild(el("span", { class: "donut-legend__val", text: counts[k] + " · " + pct + "%" }));
      legend.appendChild(li);
    });
  }

  /* ---- 03 · Rankings (top / bottom by price) ---- */
  function renderRanks() {
    const byPriceDesc = esp.key.map((_, i) => i).sort((a, b) => esp.precio[b] - esp.precio[a]);
    fillRank(qs("#rank-top"), byPriceDesc.slice(0, 3));
    fillRank(qs("#rank-bottom"), byPriceDesc.slice(-3).reverse());
  }

  function fillRank(ol, indices) {
    ol.innerHTML = "";
    indices.forEach((i) => {
      const li = el("li", { class: "rank-list__item" });
      li.appendChild(el("span", { class: "rank-list__name", text: esp.nombre[i] }));
      li.appendChild(el("span", { class: "rank-list__price", text: formatSoles(esp.precio[i]) }));
      ol.appendChild(li);
    });
  }

  /* ---- Wire controls ---- */
  selConvenio.addEventListener("change", () => {
    convenioFilter = selConvenio.value;
    renderKPIs();
    renderBars();
  });
  selSort.addEventListener("change", () => {
    sortDir = selSort.value;
    renderBars();
  });

  /* ---- Initial render ---- */
  renderKPIs();
  renderBars();
  renderDonut();
  renderRanks();
})();

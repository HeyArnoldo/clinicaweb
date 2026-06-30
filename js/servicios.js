/* ============================================================
   ClinicaWeb — Servicios page
   - Renders the specialty catalog FROM the parallel arrays (item 6 + 8)
   - Filter by convenio + sort by price (array .filter / .sort / .map)
   - "Cotizador": pick specialties and get a live total (.reduce) — item 5
   ============================================================ */
(function () {
  "use strict";

  const { qs, el, formatSoles } = window.ClinicaUI;
  const esp = window.CLINICA.especialidades;
  const convenioLabelByType = window.CLINICA.convenioLabelByType;

  // The catalog is the first data table on the page.
  const table = qs(".data-table");
  if (!table || !esp) return;
  const tbody = qs("tbody", table);

  /* ---- Filter / sort toolbar ---- */
  const wrap = table.closest(".table-wrap");
  const toolbar = el("div", { class: "filter-bar" });

  const selConv = el("select", { class: "filter-bar__select", id: "f-convenio" }, [
    el("option", { value: "", text: "Todos los convenios" }),
    el("option", { value: "ambos", text: "EsSalud · SIS" }),
    el("option", { value: "essalud", text: "Solo EsSalud" }),
    el("option", { value: "particular", text: "Particular" })
  ]);
  const selSort = el("select", { class: "filter-bar__select", id: "f-sort" }, [
    el("option", { value: "default", text: "Orden original" }),
    el("option", { value: "asc", text: "Precio: menor a mayor" }),
    el("option", { value: "desc", text: "Precio: mayor a menor" })
  ]);
  const count = el("span", { class: "filter-bar__count" });

  toolbar.appendChild(el("label", { class: "filter-bar__label", for: "f-convenio", text: "Convenio" }));
  toolbar.appendChild(selConv);
  toolbar.appendChild(el("label", { class: "filter-bar__label", for: "f-sort", text: "Ordenar" }));
  toolbar.appendChild(selSort);
  toolbar.appendChild(count);
  wrap.parentNode.insertBefore(toolbar, wrap);

  function render() {
    // Build an index list, then filter and sort THAT (keeps arrays parallel).
    let indices = esp.key.map((_, i) => i);
    if (selConv.value) {
      indices = indices.filter((i) => esp.convenioTipo[i] === selConv.value);
    }
    if (selSort.value === "asc") {
      indices.sort((a, b) => esp.precio[a] - esp.precio[b]);
    } else if (selSort.value === "desc") {
      indices.sort((a, b) => esp.precio[b] - esp.precio[a]);
    }

    tbody.innerHTML = "";
    indices.forEach((i) => {
      const row = el("tr");
      row.appendChild(el("td", {}, el("strong", { text: esp.nombre[i] })));
      row.appendChild(el("td", { text: esp.descripcion[i] }));
      row.appendChild(el("td", { class: "time", text: esp.duracion[i] + " min" }));
      row.appendChild(el("td", { class: "num price", text: String(esp.precio[i]) }));
      const badgeClass =
        esp.convenioTipo[i] === "particular" ? "badge--muted"
        : esp.convenioTipo[i] === "essalud" ? "badge--info"
        : "badge--ok";
      row.appendChild(
        el("td", {}, el("span", {
          class: "badge " + badgeClass,
          text: convenioLabelByType[esp.convenioTipo[i]]
        }))
      );
      tbody.appendChild(row);
    });

    count.textContent = indices.length + " de " + esp.key.length + " especialidades";
  }

  selConv.addEventListener("change", render);
  selSort.addEventListener("change", render);
  render();

  /* ---- Cotizador: live package total using .reduce ---- */
  buildCotizador();

  function buildCotizador() {
    const cta = qs(".cta-strip");
    if (!cta) return;

    const section = el("section", { class: "section section--alt" });
    section.innerHTML =
      '<div class="section__head"><div>' +
      '  <div class="kicker">Calculadora — Cotizador</div>' +
      "  <h2>Calcula el costo de tu paquete.</h2>" +
      '  <p class="section__lead">Marca las consultas que necesitas y obtén el total estimado al instante.</p>' +
      "</div></div>";

    const shell = el("div", { class: "form-shell form-shell--wide" });
    const card = el("div", { class: "form-card cotizador" });

    const list = el("div", { class: "cotizador__grid" });
    esp.key.forEach((key, i) => {
      const item = el("label", { class: "cotizador__item" });
      const input = el("input", { type: "checkbox", value: String(i) });
      input.addEventListener("change", recalc);
      item.appendChild(input);
      item.appendChild(el("span", { class: "cotizador__name", text: esp.nombre[i] }));
      item.appendChild(el("span", { class: "cotizador__price", text: formatSoles(esp.precio[i]) }));
      list.appendChild(item);
    });

    const result = el("div", { class: "cotizador__result" });
    result.innerHTML =
      '<div><span class="cotizador__result-label">Consultas seleccionadas</span>' +
      '<strong class="cotizador__qty">0</strong></div>' +
      '<div><span class="cotizador__result-label">Total estimado</span>' +
      '<strong class="cotizador__total">S/ 0</strong></div>';

    card.appendChild(list);
    card.appendChild(result);
    shell.appendChild(card);
    section.appendChild(shell);
    cta.parentNode.insertBefore(section, cta);

    function recalc() {
      // Collect checked indices, then reduce the parallel price array.
      const checked = window.ClinicaUI
        .qsa("input:checked", list)
        .map((input) => Number(input.value));
      const total = checked.reduce((sum, i) => sum + esp.precio[i], 0);
      qs(".cotizador__qty", result).textContent = String(checked.length);
      qs(".cotizador__total", result).textContent = formatSoles(total);
    }
  }
})();

/* ============================================================
   ClinicaWeb — Médicos page
   - Renders the directory table FROM the parallel arrays (item 6 + 8)
   - Filter toolbar by specialty and status (array .filter / .forEach)
   - "Ver" opens a floating window with the doctor detail (item 7)
   ============================================================ */
(function () {
  "use strict";

  const { qs, el, openModal } = window.ClinicaUI;
  const med = window.CLINICA.medicos;
  const { estadoLabel, estadoBadge } = window.CLINICA;

  // The directory is the first data table on the page.
  const table = qs(".data-table");
  if (!table || !med) return;
  const tbody = qs("tbody", table);

  // Build the list of unique specialties for the filter dropdown.
  const especialidades = med.espNombre.filter(
    (name, index) => med.espNombre.indexOf(name) === index
  );

  /* ---- Inject the filter toolbar above the table ---- */
  const wrap = table.closest(".table-wrap");
  const toolbar = el("div", { class: "filter-bar" });

  const selEsp = el("select", { class: "filter-bar__select", id: "f-especialidad" }, [
    el("option", { value: "", text: "Todas las especialidades" })
  ]);
  especialidades.forEach((name) =>
    selEsp.appendChild(el("option", { value: name, text: name }))
  );

  const selEstado = el("select", { class: "filter-bar__select", id: "f-estado" }, [
    el("option", { value: "", text: "Todos los estados" }),
    el("option", { value: "disponible", text: "Disponible" }),
    el("option", { value: "ocupado", text: "Ocupado hoy" }),
    el("option", { value: "vacaciones", text: "Vacaciones" })
  ]);

  const count = el("span", { class: "filter-bar__count" });

  toolbar.appendChild(el("label", { class: "filter-bar__label", for: "f-especialidad", text: "Especialidad" }));
  toolbar.appendChild(selEsp);
  toolbar.appendChild(el("label", { class: "filter-bar__label", for: "f-estado", text: "Estado" }));
  toolbar.appendChild(selEstado);
  toolbar.appendChild(count);
  wrap.parentNode.insertBefore(toolbar, wrap);

  /* ---- Render rows from the parallel arrays ---- */
  function render() {
    const espFilter = selEsp.value;
    const estadoFilter = selEstado.value;

    tbody.innerHTML = "";
    let shown = 0;

    med.nombres.forEach((nombre, i) => {
      if (espFilter && med.espNombre[i] !== espFilter) return;
      if (estadoFilter && med.estado[i] !== estadoFilter) return;
      shown++;

      const estado = med.estado[i];
      const row = el("tr");
      row.appendChild(el("td", {}, el("strong", { text: nombre })));
      row.appendChild(el("td", { text: med.espNombre[i] }));
      row.appendChild(el("td", { class: "cmp", text: med.cmp[i] }));
      row.appendChild(el("td", { class: "time", text: med.horario[i] }));
      row.appendChild(
        el("td", {}, el("span", {
          class: "badge " + estadoBadge[estado],
          text: estadoLabel[estado]
        }))
      );

      const action = el("td");
      const btn = el("button", {
        class: "action-link action-link--btn",
        type: "button",
        text: "Ver"
      });
      btn.dataset.index = String(i);
      btn.addEventListener("click", () => showDoctor(i));
      action.appendChild(btn);
      row.appendChild(action);

      tbody.appendChild(row);
    });

    count.textContent = shown + (shown === 1 ? " médico" : " médicos");
    if (shown === 0) {
      const empty = el("tr");
      empty.appendChild(
        el("td", { colspan: "6", class: "filter-bar__empty", text: "No hay médicos para ese filtro." })
      );
      tbody.appendChild(empty);
    }
  }

  /* ---- Floating window with the doctor detail ---- */
  function showDoctor(i) {
    const estado = med.estado[i];
    const disponible = estado === "disponible";
    const body =
      '<dl class="modal-detail">' +
      "  <dt>Especialidad</dt><dd>" + med.espNombre[i] + "</dd>" +
      "  <dt>CMP</dt><dd>" + med.cmp[i] + "</dd>" +
      "  <dt>Atención</dt><dd>" + med.horario[i] + "</dd>" +
      '  <dt>Estado</dt><dd><span class="badge ' + estadoBadge[estado] + '">' +
            estadoLabel[estado] + "</span></dd>" +
      "</dl>";
    const foot = disponible
      ? '<a class="btn btn--primary" href="../agenda/nueva-cita.html?med=' +
          med.espKey[i] + '">Agendar con este médico</a>' +
        '<button class="btn btn--ghost" type="button" data-close="true">Cerrar</button>'
      : '<button class="btn btn--ghost" type="button" data-close="true">Cerrar</button>';

    openModal({ title: med.nombres[i], bodyHTML: body, footHTML: foot });
  }

  selEsp.addEventListener("change", render);
  selEstado.addEventListener("change", render);
  render();
})();

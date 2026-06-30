/* ============================================================
   ClinicaWeb — Nueva cita page
   - JS form validation with custom messages (item 5)
   - Dependent selects: especialidad filters the doctor list (item 6 + 8)
   - Live cost calculator with urgent surcharge (item 5 + calculator)
   - Confirmation modal on valid submit (item 7)
   ============================================================ */
(function () {
  "use strict";

  const { qs, el, formatSoles, openModal } = window.ClinicaUI;
  const med = window.CLINICA.medicos;
  const esp = window.CLINICA.especialidades;
  const urgentSurcharge = window.CLINICA.urgentSurcharge;

  const form = qs("form");
  if (!form) return;

  const selEsp = qs("#especialidad");
  const selMedico = qs("#medico");
  const fechaInput = qs("#fecha-cita");

  /* ---- Preselect specialty from ?med= (coming from the médicos page) ---- */
  const params = new URLSearchParams(window.location.search);
  const presetEsp = params.get("med");

  /* ---- Dependent doctor list ---- */
  function fillDoctors(espKeyFilter) {
    selMedico.innerHTML = "";
    selMedico.appendChild(el("option", { value: "", text: "— Seleccione —" }));

    med.nombres.forEach((nombre, i) => {
      if (med.estado[i] === "vacaciones") return; // not bookable
      if (espKeyFilter && med.espKey[i] !== espKeyFilter) return;
      const key = med.espKey[i];
      selMedico.appendChild(
        el("option", { value: key, text: nombre + " · " + med.espNombre[i] })
      );
    });

    if (selMedico.options.length === 1) {
      selMedico.appendChild(
        el("option", { value: "", text: "Sin médico disponible para esta especialidad", disabled: true })
      );
    }
  }

  /* ---- Live cost calculator ---- */
  const summary = el("div", { class: "cost-box" });
  summary.innerHTML =
    '<div class="cost-box__head">Resumen de costo estimado</div>' +
    '<div class="cost-box__rows">' +
    '  <div class="cost-box__row"><span>Especialidad</span><span class="cost-box__esp">—</span></div>' +
    '  <div class="cost-box__row"><span>Duración</span><span class="cost-box__dur">—</span></div>' +
    '  <div class="cost-box__row"><span>Consulta base</span><span class="cost-box__base">S/ 0</span></div>' +
    '  <div class="cost-box__row cost-box__row--surcharge" hidden><span>Recargo por urgencia (+50%)</span><span class="cost-box__sur">S/ 0</span></div>' +
    '  <div class="cost-box__row cost-box__row--total"><span>Total estimado</span><span class="cost-box__total">S/ 0</span></div>' +
    "</div>" +
    '<p class="cost-box__note">Monto referencial. El costo final puede variar según convenio y exámenes adicionales.</p>';
  // Drop the calculator right after the "detalles de la consulta" fieldset.
  const fieldsets = window.ClinicaUI.qsa(".form-fieldset", form);
  const consultaFieldset = fieldsets[1] || fieldsets[0];
  consultaFieldset.appendChild(summary);

  function recalcCost() {
    const idx = esp.key.indexOf(selEsp.value);
    const tipo = (form.querySelector('input[name="tipo"]:checked') || {}).value;

    if (idx === -1) {
      qs(".cost-box__esp", summary).textContent = "—";
      qs(".cost-box__dur", summary).textContent = "—";
      qs(".cost-box__base", summary).textContent = "S/ 0";
      qs(".cost-box__total", summary).textContent = "S/ 0";
      qs(".cost-box__row--surcharge", summary).hidden = true;
      return;
    }

    const base = esp.precio[idx];
    const isUrgent = tipo === "urgente";
    const surcharge = isUrgent ? Math.round(base * urgentSurcharge) : 0;
    const total = base + surcharge;

    qs(".cost-box__esp", summary).textContent = esp.nombre[idx];
    qs(".cost-box__dur", summary).textContent = esp.duracion[idx] + " min";
    qs(".cost-box__base", summary).textContent = formatSoles(base);
    qs(".cost-box__row--surcharge", summary).hidden = !isUrgent;
    qs(".cost-box__sur", summary).textContent = formatSoles(surcharge);
    qs(".cost-box__total", summary).textContent = formatSoles(total);
  }

  selEsp.addEventListener("change", () => {
    fillDoctors(selEsp.value);
    recalcCost();
  });
  window.ClinicaUI.qsa('input[name="tipo"]', form).forEach((radio) =>
    radio.addEventListener("change", recalcCost)
  );

  /* ---- Validation helpers ---- */
  function setError(field, message) {
    field.classList.add("field--error");
    let msg = qs(".field__error", field);
    if (!msg) {
      msg = el("p", { class: "field__error" });
      field.appendChild(msg);
    }
    msg.textContent = message;
  }
  function clearError(field) {
    field.classList.remove("field--error");
    const msg = qs(".field__error", field);
    if (msg) msg.remove();
  }

  function validateControl(control) {
    const field = control.closest(".field");
    if (!field) return control.checkValidity();
    clearError(field);
    if (!control.checkValidity()) {
      let message = "Revisa este campo.";
      if (control.validity.valueMissing) message = "Este campo es obligatorio.";
      else if (control.validity.typeMismatch) message = "El formato no es válido.";
      else if (control.validity.patternMismatch) message = "Solo se permiten dígitos en el formato indicado.";
      else if (control.validity.tooShort)
        message = "Mínimo " + control.minLength + " caracteres.";
      setError(field, message);
      return false;
    }
    return true;
  }

  function validateForm() {
    let firstInvalid = null;
    const controls = window.ClinicaUI.qsa("input, select, textarea", form);

    controls.forEach((control) => {
      if (control.type === "radio" || control.type === "checkbox") return;
      if (!validateControl(control) && !firstInvalid) firstInvalid = control;
    });

    // Radio group: tipo de consulta.
    const tipoChecked = form.querySelector('input[name="tipo"]:checked');
    const tipoField = form.querySelector('input[name="tipo"]').closest(".field");
    clearError(tipoField);
    if (!tipoChecked) {
      setError(tipoField, "Selecciona el tipo de consulta.");
      if (!firstInvalid) firstInvalid = form.querySelector('input[name="tipo"]');
    }

    // Consent checkbox.
    const acepto = qs("#acepto");
    const aceptoBox = acepto.closest(".consent");
    aceptoBox.classList.toggle("consent--error", !acepto.checked);
    if (!acepto.checked && !firstInvalid) firstInvalid = acepto;

    if (firstInvalid) firstInvalid.focus();
    return !firstInvalid;
  }

  // Clear a field's error as soon as the user fixes it.
  form.addEventListener("input", (event) => {
    const field = event.target.closest(".field");
    if (field && field.classList.contains("field--error")) validateControl(event.target);
  });

  /* ---- Submit ---- */
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!validateForm()) return;

    const idx = esp.key.indexOf(selEsp.value);
    const total = qs(".cost-box__total", summary).textContent;
    const turno = "CW-" + String(Math.floor(1000 + Math.random() * 9000));
    const medicoLabel = selMedico.options[selMedico.selectedIndex].text;

    const body =
      '<p class="modal-lead">Tu solicitud fue registrada. Te confirmaremos por correo en un plazo de <strong>2 horas hábiles</strong>.</p>' +
      '<dl class="modal-detail">' +
      "  <dt>Código de turno</dt><dd><strong>" + turno + "</strong></dd>" +
      "  <dt>Paciente</dt><dd>" + qs("#pac-nombre").value + "</dd>" +
      "  <dt>Especialidad</dt><dd>" + (idx > -1 ? esp.nombre[idx] : "—") + "</dd>" +
      "  <dt>Médico</dt><dd>" + medicoLabel + "</dd>" +
      "  <dt>Fecha y hora</dt><dd>" + fechaInput.value + " · " + qs("#hora-cita").value + "</dd>" +
      "  <dt>Costo estimado</dt><dd>" + total + "</dd>" +
      "</dl>";

    openModal({
      title: "✓ Cita solicitada",
      bodyHTML: body,
      footHTML:
        '<button class="btn btn--primary" type="button" data-close="true">Listo</button>'
    });
    form.reset();
    fillDoctors("");
    recalcCost();
  });

  /* ---- Init ---- */
  fillDoctors(presetEsp || "");
  if (presetEsp && esp.key.indexOf(presetEsp) > -1) {
    selEsp.value = presetEsp;
  }
  recalcCost();
})();

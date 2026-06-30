/* ============================================================
   ClinicaWeb — Registro de paciente page
   - JS form validation with custom messages (item 5)
   - Age calculator from the birth date (item 5 + calculator)
   - Injected BMI (IMC) calculator widget (item 5 + 8 + calculator)
   - Success modal on valid submit (item 7)
   ============================================================ */
(function () {
  "use strict";

  const { qs, el, openModal } = window.ClinicaUI;

  const form = qs("form");
  if (!form) return;

  const fechaNac = qs("#fecha-nac");

  /* ---- Age calculator (live hint under the birth date) ---- */
  const ageHint = el("p", { class: "field__hint field__hint--age" });
  fechaNac.parentNode.appendChild(ageHint);

  function calcAge() {
    if (!fechaNac.value) {
      ageHint.textContent = "";
      return;
    }
    const birth = new Date(fechaNac.value);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;

    if (age < 0) {
      ageHint.textContent = "La fecha no puede ser futura.";
    } else if (age < 18) {
      ageHint.textContent = "Edad: " + age + " años — el registro requiere ser mayor de edad.";
    } else {
      ageHint.textContent = "Edad: " + age + " años.";
    }
  }
  fechaNac.addEventListener("change", calcAge);

  /* ---- BMI (IMC) calculator injected into the medical info fieldset ---- */
  buildBmiWidget();

  function buildBmiWidget() {
    const fieldsets = window.ClinicaUI.qsa(".form-fieldset", form);
    const target = fieldsets[fieldsets.length - 1]; // "04 · Información médica"

    const widget = el("div", { class: "bmi" });
    widget.innerHTML =
      '<div class="bmi__head">Calculadora de IMC <span>(opcional)</span></div>' +
      '<div class="form-row">' +
      '  <div class="field"><label for="imc-peso">Peso (kg)</label>' +
      '    <input type="number" id="imc-peso" min="1" max="400" step="0.1" placeholder="70"></div>' +
      '  <div class="field"><label for="imc-talla">Talla (cm)</label>' +
      '    <input type="number" id="imc-talla" min="30" max="250" step="1" placeholder="170"></div>' +
      "</div>" +
      '<div class="bmi__result"><span class="bmi__value">IMC: —</span>' +
      '<span class="bmi__class"></span></div>';
    target.appendChild(widget);

    const peso = qs("#imc-peso", widget);
    const talla = qs("#imc-talla", widget);
    const value = qs(".bmi__value", widget);
    const klass = qs(".bmi__class", widget);

    function recalc() {
      const kg = parseFloat(peso.value);
      const cm = parseFloat(talla.value);
      if (!(kg > 0) || !(cm > 0)) {
        value.textContent = "IMC: —";
        klass.textContent = "";
        klass.className = "bmi__class";
        return;
      }
      const m = cm / 100;
      const imc = kg / (m * m);
      value.textContent = "IMC: " + imc.toFixed(1);

      let label, badge;
      if (imc < 18.5) { label = "Bajo peso"; badge = "badge--info"; }
      else if (imc < 25) { label = "Peso normal"; badge = "badge--ok"; }
      else if (imc < 30) { label = "Sobrepeso"; badge = "badge--warn"; }
      else { label = "Obesidad"; badge = "badge--danger"; }
      klass.textContent = label;
      klass.className = "bmi__class badge " + badge;
    }
    peso.addEventListener("input", recalc);
    talla.addEventListener("input", recalc);
  }

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
      else if (control.validity.tooShort) message = "Mínimo " + control.minLength + " caracteres.";
      else if (control.validity.rangeOverflow) message = "Debes ser mayor de edad para registrarte.";
      setError(field, message);
      return false;
    }
    return true;
  }

  function validateForm() {
    let firstInvalid = null;
    // The injected BMI inputs are optional — skip them in validation.
    window.ClinicaUI.qsa("input, select, textarea", form).forEach((control) => {
      if (control.type === "radio" || control.type === "checkbox") return;
      if (control.id === "imc-peso" || control.id === "imc-talla") return;
      if (!validateControl(control) && !firstInvalid) firstInvalid = control;
    });

    const sexoChecked = form.querySelector('input[name="sexo"]:checked');
    const sexoField = form.querySelector('input[name="sexo"]').closest(".field");
    clearError(sexoField);
    if (!sexoChecked) {
      setError(sexoField, "Selecciona una opción.");
      if (!firstInvalid) firstInvalid = form.querySelector('input[name="sexo"]');
    }

    const terminos = qs("#terminos");
    terminos.closest(".consent").classList.toggle("consent--error", !terminos.checked);
    if (!terminos.checked && !firstInvalid) firstInvalid = terminos;

    if (firstInvalid) firstInvalid.focus();
    return !firstInvalid;
  }

  form.addEventListener("input", (event) => {
    const field = event.target.closest(".field");
    if (field && field.classList.contains("field--error")) validateControl(event.target);
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!validateForm()) return;

    const body =
      '<p class="modal-lead">Tu ficha de paciente fue creada correctamente. Ya puedes agendar citas más rápido.</p>' +
      '<dl class="modal-detail">' +
      "  <dt>Paciente</dt><dd>" + qs("#nombres").value + " " + qs("#apellidos").value + "</dd>" +
      "  <dt>Documento</dt><dd>" + qs("#num-doc").value + "</dd>" +
      "  <dt>Correo</dt><dd>" + qs("#email").value + "</dd>" +
      "  <dt>Seguro</dt><dd>" + qs("#seguro").options[qs("#seguro").selectedIndex].text + "</dd>" +
      "</dl>";

    openModal({
      title: "✓ Registro completado",
      bodyHTML: body,
      footHTML:
        '<a class="btn btn--primary" href="../agenda/nueva-cita.html">Agendar una cita</a>' +
        '<button class="btn btn--ghost" type="button" data-close="true">Cerrar</button>'
    });
    form.reset();
    ageHint.textContent = "";
  });
})();

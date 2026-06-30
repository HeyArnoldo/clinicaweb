/* ============================================================
   ClinicaWeb — Contacto page
   - JS form validation with custom messages (item 5)
   - Live character counter on the message textarea (item 8)
   - Confirmation modal on valid submit (item 7)
   ============================================================ */
(function () {
  "use strict";

  const { qs, el, openModal } = window.ClinicaUI;

  const form = qs("form");
  if (!form) return;

  /* ---- Live character counter ---- */
  const mensaje = qs("#mensaje");
  const max = Number(mensaje.getAttribute("maxlength")) || 1000;
  const counter = el("span", { class: "char-counter" });
  const hint = mensaje.parentNode.querySelector(".field__hint");
  if (hint) hint.appendChild(counter);

  function updateCounter() {
    const len = mensaje.value.length;
    counter.textContent = " · " + len + "/" + max;
    counter.classList.toggle("char-counter--low", len > 0 && len < 20);
  }
  mensaje.addEventListener("input", updateCounter);
  updateCounter();

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
      setError(field, message);
      return false;
    }
    return true;
  }

  function validateForm() {
    let firstInvalid = null;
    window.ClinicaUI.qsa("input, select, textarea", form).forEach((control) => {
      if (control.type === "checkbox") return;
      if (!validateControl(control) && !firstInvalid) firstInvalid = control;
    });

    const privacidad = qs("#privacidad");
    privacidad.closest(".consent").classList.toggle("consent--error", !privacidad.checked);
    if (!privacidad.checked && !firstInvalid) firstInvalid = privacidad;

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

    const asunto = qs("#asunto");
    const body =
      '<p class="modal-lead">Recibimos tu mensaje. Te responderemos en un máximo de <strong>24 horas hábiles</strong>.</p>' +
      '<dl class="modal-detail">' +
      "  <dt>Nombre</dt><dd>" + qs("#nombre").value + "</dd>" +
      "  <dt>Correo</dt><dd>" + qs("#email").value + "</dd>" +
      "  <dt>Asunto</dt><dd>" + asunto.options[asunto.selectedIndex].text + "</dd>" +
      "</dl>";

    openModal({
      title: "✓ Mensaje enviado",
      bodyHTML: body,
      footHTML:
        '<button class="btn btn--primary" type="button" data-close="true">Listo</button>'
    });
    form.reset();
    updateCounter();
  });
})();

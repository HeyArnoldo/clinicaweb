/* ============================================================
   ClinicaWeb — Shared UI behaviour (loaded on every page)
   Rubric items covered here:
   - 7: Menú responsivo (hamburguesa) + ventanas flotantes (modal)
   - 8: Manipulación del DOM (createElement, classList, dataset...)
   Exposes window.ClinicaUI with reusable helpers for page scripts.
   ============================================================ */
(function () {
  "use strict";

  // Flag the document so CSS only collapses the nav when JS is active
  // (progressive enhancement: without JS the menu still wraps and works).
  document.documentElement.classList.add("js");

  /* ---------- Tiny DOM helpers (reused by every page script) ---------- */
  const qs = (selector, scope) => (scope || document).querySelector(selector);
  const qsa = (selector, scope) =>
    Array.from((scope || document).querySelectorAll(selector));

  // Build an element from a tag, attributes object and children.
  function el(tag, attrs, children) {
    const node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach((key) => {
        if (key === "class") node.className = attrs[key];
        else if (key === "text") node.textContent = attrs[key];
        else if (key === "html") node.innerHTML = attrs[key];
        else if (key.startsWith("data-")) node.setAttribute(key, attrs[key]);
        else if (key in node) node[key] = attrs[key];
        else node.setAttribute(key, attrs[key]);
      });
    }
    if (children != null) {
      (Array.isArray(children) ? children : [children]).forEach((child) => {
        if (child == null) return;
        node.appendChild(
          typeof child === "string" ? document.createTextNode(child) : child
        );
      });
    }
    return node;
  }

  const formatSoles = (amount) =>
    "S/ " + Number(amount).toLocaleString("es-PE", { minimumFractionDigits: 0 });

  /* ---------- Responsive hamburger menu ---------- */
  function setupHamburger() {
    const inner = qs(".site-header__inner");
    const nav = qs(".site-nav");
    if (!inner || !nav) return;

    const button = el("button", {
      class: "nav-toggle",
      type: "button",
      "aria-label": "Abrir menú de navegación",
      "aria-expanded": "false",
      "aria-controls": "site-nav",
      html: '<span class="nav-toggle__bar"></span>' +
            '<span class="nav-toggle__bar"></span>' +
            '<span class="nav-toggle__bar"></span>'
    });

    nav.id = "site-nav";
    // Place the burger right after the brand (first child of the header row).
    inner.insertBefore(button, inner.children[1] || null);

    const close = () => {
      inner.classList.remove("is-nav-open");
      button.setAttribute("aria-expanded", "false");
      button.setAttribute("aria-label", "Abrir menú de navegación");
    };
    const open = () => {
      inner.classList.add("is-nav-open");
      button.setAttribute("aria-expanded", "true");
      button.setAttribute("aria-label", "Cerrar menú de navegación");
    };

    button.addEventListener("click", () => {
      if (inner.classList.contains("is-nav-open")) close();
      else open();
    });

    // Close when a link is tapped or the viewport grows back to desktop.
    qsa("a", nav).forEach((link) => link.addEventListener("click", close));
    window.addEventListener("resize", () => {
      if (window.innerWidth > 760) close();
    });
  }

  /* ---------- Floating window (modal) system ---------- */
  let modalRoot = null;
  let lastFocused = null;

  function buildModalRoot() {
    modalRoot = el("div", { class: "modal-root", hidden: true });
    modalRoot.innerHTML =
      '<div class="modal-backdrop" data-close="true"></div>' +
      '<div class="modal-dialog" role="dialog" aria-modal="true" aria-labelledby="modal-title">' +
      '  <button class="modal-close" type="button" aria-label="Cerrar" data-close="true">&times;</button>' +
      '  <h2 class="modal-title" id="modal-title"></h2>' +
      '  <div class="modal-body"></div>' +
      '  <div class="modal-foot"></div>' +
      "</div>";
    document.body.appendChild(modalRoot);

    // Any element marked data-close closes the modal (backdrop + close button).
    modalRoot.addEventListener("click", (event) => {
      if (event.target.dataset.close === "true") closeModal();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !modalRoot.hidden) closeModal();
    });
  }

  // openModal({ title, bodyHTML, footHTML })
  function openModal(options) {
    if (!modalRoot) buildModalRoot();
    const opts = options || {};
    qs(".modal-title", modalRoot).textContent = opts.title || "";
    qs(".modal-body", modalRoot).innerHTML = opts.bodyHTML || "";
    qs(".modal-foot", modalRoot).innerHTML =
      opts.footHTML ||
      '<button class="btn btn--primary" type="button" data-close="true">Entendido</button>';

    lastFocused = document.activeElement;
    modalRoot.hidden = false;
    // Force reflow so the CSS entrance animation runs every time.
    void modalRoot.offsetWidth;
    modalRoot.classList.add("is-open");
    document.body.classList.add("modal-open");

    const focusTarget = qs(".modal-close", modalRoot);
    if (focusTarget) focusTarget.focus();
  }

  function closeModal() {
    if (!modalRoot) return;
    modalRoot.classList.remove("is-open");
    document.body.classList.remove("modal-open");
    // Wait for the exit transition before hiding the node.
    window.setTimeout(() => {
      modalRoot.hidden = true;
    }, 200);
    if (lastFocused && typeof lastFocused.focus === "function") {
      lastFocused.focus();
    }
  }

  /* ---------- Public API ---------- */
  window.ClinicaUI = { qs, qsa, el, formatSoles, openModal, closeModal };

  document.addEventListener("DOMContentLoaded", setupHamburger);
})();

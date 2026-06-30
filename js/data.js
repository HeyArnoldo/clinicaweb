/* ============================================================
   ClinicaWeb — Data layer (single source of truth)
   Plain script, no modules: exposes window.CLINICA so every
   page script can read the same data.

   Rubric item 6 ("Arrays paralelos"): the medical staff and the
   service catalog are stored as PARALLEL ARRAYS — several arrays
   sharing the same index. medNombres[i], medEspNombre[i],
   medCmp[i]... all describe the SAME doctor i.
   ============================================================ */
(function () {
  "use strict";

  /* ---- Medical staff — 8 doctors, parallel arrays ---- */
  const medNombres = [
    "Dr. Carlos Mendoza",
    "Dra. María Torres",
    "Dr. Roberto Salas",
    "Dra. Ana Quispe",
    "Dr. Jorge Vega",
    "Dra. Lucía Flores",
    "Dr. Miguel Ramos",
    "Dra. Patricia León"
  ];
  const medEspKey = [
    "cardiologia", "pediatria", "traumatologia", "neurologia",
    "oftalmologia", "dermatologia", "gastro", "endocrinologia"
  ];
  const medEspNombre = [
    "Cardiología", "Pediatría", "Traumatología", "Neurología",
    "Oftalmología", "Dermatología", "Gastroenterología", "Endocrinología"
  ];
  const medCmp = [
    "45231", "38742", "52184", "61037", "29856", "74512", "83649", "41293"
  ];
  const medHorario = [
    "Lun–Vie · 08:00–13:00",
    "Lun–Sáb · 09:00–14:00",
    "Mar–Sáb · 10:00–16:00",
    "Lun–Jue · 07:00–12:00",
    "Mié–Sáb · 08:00–13:00",
    "Lun–Vie · 14:00–19:00",
    "Lun–Vie · 08:00–14:00",
    "Mar–Sáb · 09:00–15:00"
  ];
  // status: "disponible" | "ocupado" | "vacaciones"
  const medEstado = [
    "disponible", "disponible", "disponible", "ocupado",
    "disponible", "disponible", "vacaciones", "disponible"
  ];

  /* ---- Service catalog — 10 specialties, parallel arrays ---- */
  const espKey = [
    "cardiologia", "pediatria", "traumatologia", "neurologia", "oftalmologia",
    "dermatologia", "gastro", "endocrinologia", "ginecologia", "radiologia"
  ];
  const espNombre = [
    "Cardiología", "Pediatría", "Traumatología", "Neurología", "Oftalmología",
    "Dermatología", "Gastroenterología", "Endocrinología", "Ginecología", "Radiología"
  ];
  const espDescripcion = [
    "Consulta general y electrocardiograma",
    "Consulta pediátrica y control de crecimiento",
    "Evaluación musculoesquelética",
    "Diagnóstico del sistema nervioso",
    "Examen visual completo y fondo de ojo",
    "Evaluación de piel y diagnóstico de lesiones",
    "Evaluación del sistema digestivo",
    "Trastornos hormonales, diabetes y tiroides",
    "Control ginecológico y Papanicolaou",
    "Rayos X, ecografías y tomografías"
  ];
  const espDuracion = [45, 30, 40, 50, 35, 30, 60, 45, 40, 20]; // minutes
  const espPrecio   = [120, 80, 110, 140, 90, 95, 160, 130, 100, 70]; // S/
  // convenioTipo: "ambos" (EsSalud + SIS) | "essalud" | "particular"
  const espConvenioTipo = [
    "ambos", "ambos", "essalud", "essalud", "ambos",
    "particular", "essalud", "ambos", "ambos", "ambos"
  ];
  const espConvenioLabel = [
    "EsSalud · SIS", "EsSalud · SIS", "EsSalud", "EsSalud", "EsSalud · SIS",
    "Particular", "EsSalud", "EsSalud · SIS", "EsSalud · SIS", "EsSalud · SIS"
  ];

  /* ---- Surcharge applied to urgent appointments (rubric calculator) ---- */
  const URGENT_SURCHARGE = 0.5; // +50 %

  window.CLINICA = {
    medicos: {
      nombres: medNombres,
      espKey: medEspKey,
      espNombre: medEspNombre,
      cmp: medCmp,
      horario: medHorario,
      estado: medEstado
    },
    especialidades: {
      key: espKey,
      nombre: espNombre,
      descripcion: espDescripcion,
      duracion: espDuracion,
      precio: espPrecio,
      convenioTipo: espConvenioTipo,
      convenioLabel: espConvenioLabel
    },
    urgentSurcharge: URGENT_SURCHARGE,
    estadoLabel: {
      disponible: "Disponible",
      ocupado: "Ocupado hoy",
      vacaciones: "Vacaciones"
    },
    estadoBadge: {
      disponible: "badge--ok",
      ocupado: "badge--info",
      vacaciones: "badge--muted"
    },
    convenioLabelByType: {
      ambos: "EsSalud · SIS",
      essalud: "EsSalud",
      particular: "Particular"
    }
  };
})();

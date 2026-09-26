// Interface copy for each language, rendered by portfolios/cabanyal.tsx.
// Content lives in data.ts. Text between *asterisks* is set in the serif italic.
import type { Lang } from './types.ts';

const en = {
  title: "Victor Esteban — Software Engineer",
  skipToContent: "Skip to content",
  backToTopLabel: "Victor Esteban, back to top",
  place: "Valencia, by the sea",
  sectionsLabel: "Sections",
  languageLabel: "Language",
  navWork: "Work",
  navStack: "Stack",
  navContact: "Contact",
  navCv: "CV",
  introLabel: "Introduction",
  factsLabel: "At a glance",
  hero: [
    "*Product-minded* and",
    "AI-oriented software engineer.",
    "I turn what a business needs",
    "into software that works."
  ],
  linkedinCta: "Get in touch on LinkedIn ↗",
  downloadCv: "Download CV",
  work: "Work",
  colWhat: "What I did",
  colNotes: "Notes",
  via: "via",
  note: "Note",
  contributions: "Contributions",
  earlier: "Earlier experience",
  roles: "roles",
  stack: "Stack",
  certifications: "Certifications",
  inPreparation: "— in preparation",
  eduLang: "Education & languages",
  contact: "Contact",
  contactTitle: "Looking for a software engineer who owns production and builds with AI, *safely*?",
  email: "Email",
  location: "Location",
  backToTop: "Back to top ↑"
};

/** Every language defines exactly the keys of the English copy. */
export type UiStrings = typeof en;

const es: UiStrings = {
  title: "Victor Esteban — Software Engineer",
  skipToContent: "Saltar al contenido",
  backToTopLabel: "Victor Esteban, volver arriba",
  place: "Valencia, junto al mar",
  sectionsLabel: "Secciones",
  languageLabel: "Idioma",
  navWork: "Experiencia",
  navStack: "Stack",
  navContact: "Contacto",
  navCv: "CV",
  introLabel: "Introducción",
  factsLabel: "En resumen",
  hero: [
    "Software engineer con",
    "*visión de producto* y foco en IA.",
    "Convierto lo que un negocio necesita",
    "en software que funciona."
  ],
  linkedinCta: "Contacta conmigo en LinkedIn ↗",
  downloadCv: "Descargar CV",
  work: "Experiencia",
  colWhat: "Qué hice",
  colNotes: "Notas",
  via: "vía",
  note: "Nota",
  contributions: "Contribuciones",
  earlier: "Experiencia anterior",
  roles: "puestos",
  stack: "Stack",
  certifications: "Certificaciones",
  inPreparation: "— en preparación",
  eduLang: "Formación e idiomas",
  contact: "Contacto",
  contactTitle: "¿Buscas a alguien que se haga cargo de producción y construya con IA de forma *segura*?",
  email: "Correo",
  location: "Ubicación",
  backToTop: "Volver arriba ↑"
};

const va: UiStrings = {
  title: "Victor Esteban — Software Engineer",
  skipToContent: "Anar al contingut",
  backToTopLabel: "Victor Esteban, tornar a dalt",
  place: "València, vora la mar",
  sectionsLabel: "Seccions",
  languageLabel: "Idioma",
  navWork: "Experiència",
  navStack: "Stack",
  navContact: "Contacte",
  navCv: "CV",
  introLabel: "Introducció",
  factsLabel: "En resum",
  hero: [
    "Software engineer amb",
    "*visió de producte* i focus en IA.",
    "Convertisc el que cal a un negoci",
    "en programari que funciona."
  ],
  linkedinCta: "Contacta amb mi a LinkedIn ↗",
  downloadCv: "Descarregar el CV",
  work: "Experiència",
  colWhat: "Què vaig fer",
  colNotes: "Notes",
  via: "via",
  note: "Nota",
  contributions: "Contribucions",
  earlier: "Experiència anterior",
  roles: "llocs",
  stack: "Stack",
  certifications: "Certificacions",
  inPreparation: "— en preparació",
  eduLang: "Formació i idiomes",
  contact: "Contacte",
  contactTitle: "Busques algú que es faça càrrec de producció i construïsca amb IA de manera *segura*?",
  email: "Correu",
  location: "Ubicació",
  backToTop: "Tornar a dalt ↑"
};

export const STRINGS: Record<Lang, UiStrings> = { en, es, va };

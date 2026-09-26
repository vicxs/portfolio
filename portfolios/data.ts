// Portfolio content, rendered by portfolios/cabanyal.tsx
// Translatable fields are { en, es, va } triples; plain values are shared by all.
import type { Portfolio } from './types.ts';

export const VICTOR: Portfolio = {
  name: "Victor Esteban",
  role: "Software Engineer",
  location: { en: "Valencia, Spain", es: "Valencia, España", va: "València, Espanya" },
  linkedin: "linkedin.com/in/victorestebann",
  github: "github.com/vicxs",
  linkedinUrl: "https://www.linkedin.com/in/victorestebann",
  githubUrl: "https://github.com/vicxs",
  email: "hola@victoresteban.com",
  emailUrl: "mailto:hola@victoresteban.com",
  cvUrl: {
    en: "assets/Victor_Esteban_CV.pdf",
    es: "assets/Victor_Esteban_CV_ES.pdf",
    va: "assets/Victor_Esteban_CV_VA.pdf"
  },

  lede: {
    en: "Based in Valencia, with 5+ years building products for Toyota, Inditex and Mercadona. I design the solution, build it with the team, own it in production and bring in AI where it adds value.",
    es: "Desde Valencia, con más de 5 años construyendo productos para Toyota, Inditex y Mercadona. Diseño la solución, la construyo con el equipo, me hago cargo de ella en producción e incorporo IA donde aporta valor.",
    va: "Des de València, amb més de 5 anys construint productes per a Toyota, Inditex i Mercadona. Dissenye la solució, la construïsc amb l'equip, me'n faig càrrec en producció i incorpore IA allà on aporta valor."
  },

  // Shown beside the lede, two by two. `live` adds the pulsing dot.
  facts: [
    { label: { en: "Now", es: "Ahora", va: "Ara" }, value: "Toyota Motor Europe", sub: { en: "via Xplore Group", es: "vía Xplore Group", va: "via Xplore Group" }, live: true },
    { label: { en: "Experience", es: "Experiencia", va: "Experiència" }, value: { en: "5+ years", es: "5+ años", va: "5+ anys" }, sub: { en: "in production systems", es: "en sistemas en producción", va: "en sistemes en producció" } },
    { label: { en: "Sectors", es: "Sectores", va: "Sectors" }, value: { en: "Automotive · Retail · Logistics", es: "Automoción · Retail · Logística", va: "Automoció · Retail · Logística" } },
    { label: { en: "Focus", es: "Foco", va: "Focus" }, value: { en: "Backend · Integration · AI", es: "Backend · Integración · IA", va: "Backend · Integració · IA" } }
  ],

  experiences: [
    {
      tier: "main",
      company: "Xplore Group",
      client: "Toyota Motor Europe",
      role: "Software Engineer",
      current: true,
      period: { en: "Nov 2024 — Present", es: "Nov 2024 — Actualidad", va: "Nov 2024 — Actualitat" },
      location: "Valencia",
      summary: {
        en: "Leading pan-European backend systems across product and dealer domains, serving high-traffic APIs that consolidate data for Toyota's European operations.",
        es: "Lidero sistemas backend paneuropeos en los dominios de producto y concesionarios, con APIs de alto tráfico que consolidan datos para las operaciones europeas de Toyota.",
        va: "Lidere sistemes backend paneuropeus en els dominis de producte i concessionaris, amb API d'alt trànsit que consoliden dades per a les operacions europees de Toyota."
      },
      note: {
        en: "High-traffic APIs serving 2M+ requests a day across product and dealer domains.",
        es: "APIs de alto tráfico que atienden más de 2 M de peticiones al día en los dominios de producto y concesionarios.",
        va: "API d'alt trànsit que atenen més de 2 M de peticions al dia en els dominis de producte i concessionaris."
      },
      bullets: {
        en: [
          "Maintained and evolved high-traffic APIs serving 2M+ requests/day across product and dealer domains.",
          "Drove technical solution design for cross-domain features and led integration with adjacent teams.",
          "Improved observability across services, reducing time-to-diagnose for production incidents.",
          "Owned legacy modernization work while keeping the system fully operational for dependent teams."
        ],
        es: [
          "Mantuve y evolucioné APIs de alto tráfico que atienden más de 2 M de peticiones/día en los dominios de producto y concesionarios.",
          "Impulsé el diseño técnico de funcionalidades transversales y lideré la integración con los equipos adyacentes.",
          "Mejoré la observabilidad de los servicios, reduciendo el tiempo de diagnóstico de incidencias en producción.",
          "Asumí la modernización del legacy manteniendo el sistema plenamente operativo para los equipos que dependen de él."
        ],
        va: [
          "Vaig mantindre i fer evolucionar API d'alt trànsit que atenen més de 2 M de peticions/dia en els dominis de producte i concessionaris.",
          "Vaig impulsar el disseny tècnic de funcionalitats transversals i vaig liderar la integració amb els equips adjacents.",
          "Vaig millorar l'observabilitat dels serveis, reduint el temps de diagnòstic d'incidències en producció.",
          "Vaig assumir la modernització del legacy mantenint el sistema plenament operatiu per als equips que en depenen."
        ]
      }
    },
    {
      tier: "main",
      company: "Plexus Tech",
      client: "Inditex",
      role: "Software Engineer",
      period: { en: "Dec 2023 — Nov 2024", es: "Dic 2023 — Nov 2024", va: "Des 2023 — Nov 2024" },
      location: "Valencia",
      summary: {
        en: "Backend engineer on production systems, contributing to a Kafka-based data aggregation platform that unified data exposure for downstream consumers.",
        es: "Desarrollo backend en sistemas en producción, contribuyendo a una plataforma de agregación de datos basada en Kafka que unificó la exposición de datos para los consumidores downstream.",
        va: "Desenvolupament backend en sistemes en producció, contribuint a una plataforma d'agregació de dades basada en Kafka que va unificar l'exposició de dades per als consumidors downstream."
      },
      bullets: {
        en: [
          "Contributed to Kafka-based data aggregation feeding multiple downstream domains.",
          "Worked on production backend services with steady release cadence and on-call ownership.",
          "Helped shape consumer-facing data contracts used across the organization."
        ],
        es: [
          "Contribuí a la agregación de datos basada en Kafka que alimenta varios dominios downstream.",
          "Trabajé en servicios backend en producción con una cadencia de releases constante y guardias on-call.",
          "Ayudé a definir los contratos de datos para consumidores que se usan en toda la organización."
        ],
        va: [
          "Vaig contribuir a l'agregació de dades basada en Kafka que alimenta diversos dominis downstream.",
          "Vaig treballar en serveis backend en producció amb una cadència de releases constant i guàrdies on-call.",
          "Vaig ajudar a definir els contractes de dades per a consumidors que s'utilitzen en tota l'organització."
        ]
      }
    },
    {
      tier: "main",
      company: "Mercadona",
      domain: { en: "Logistics & Supply Chain", es: "Logística y cadena de suministro", va: "Logística i cadena de subministrament" },
      role: "Software Engineer",
      period: { en: "Mar 2022 — Dec 2023", es: "Mar 2022 — Dic 2023", va: "Mar 2022 — Des 2023" },
      location: "Valencia",
      summary: {
        en: "Backend engineer on logistics platforms, contributing to warehouse migrations, Kafka-based data unification, and legal-compliance workflows.",
        es: "Desarrollo backend en plataformas logísticas, contribuyendo a migraciones de almacenes, a la unificación de datos basada en Kafka y a flujos de cumplimiento legal.",
        va: "Desenvolupament backend en plataformes logístiques, contribuint a migracions de magatzems, a la unificació de dades basada en Kafka i a fluxos de compliment legal."
      },
      note: {
        en: "A warehouse migration with strict consistency requirements and a minimal-downtime cutover.",
        es: "Una migración de almacén con requisitos estrictos de consistencia y un cutover con mínima indisponibilidad.",
        va: "Una migració de magatzem amb requisits estrictes de consistència i un cutover amb una indisponibilitat mínima."
      },
      bullets: {
        en: [
          "Designed and shipped a Kafka-based data unification layer used across logistics services.",
          "Led a warehouse migration with strict consistency requirements and minimal downtime cutover.",
          "Built an inter-warehouse transfer solution coordinating multiple operational systems.",
          "Delivered a document-signing flow with cloud storage, replacing paper-based workflows and meeting legal compliance.",
          "Took technical decisions on integration patterns, message contracts, and rollout strategies."
        ],
        es: [
          "Diseñé y puse en producción una capa de unificación de datos basada en Kafka utilizada por los servicios logísticos.",
          "Lideré una migración de almacén con requisitos estrictos de consistencia y un cutover con mínima indisponibilidad.",
          "Construí una solución de traspasos entre almacenes que coordina varios sistemas operacionales.",
          "Entregué un flujo de firma de documentos con almacenamiento en la nube que sustituyó procesos en papel y cumple la normativa legal.",
          "Tomé decisiones técnicas sobre patrones de integración, contratos de mensajes y estrategias de despliegue."
        ],
        va: [
          "Vaig dissenyar i posar en producció una capa d'unificació de dades basada en Kafka utilitzada pels serveis logístics.",
          "Vaig liderar una migració de magatzem amb requisits estrictes de consistència i un cutover amb una indisponibilitat mínima.",
          "Vaig construir una solució de traspassos entre magatzems que coordina diversos sistemes operacionals.",
          "Vaig lliurar un flux de signatura de documents amb emmagatzematge en el núvol que va substituir processos en paper i complix la normativa legal.",
          "Vaig prendre decisions tècniques sobre patrons d'integració, contractes de missatges i estratègies de desplegament."
        ]
      }
    },
    {
      tier: "secondary",
      company: "Capgemini",
      role: "Software Engineer",
      period: { en: "Jan 2021 — Mar 2022", es: "Ene 2021 — Mar 2022", va: "Gen 2021 — Mar 2022" },
      summary: {
        en: "Backend development for Consum, in the food retail sector.",
        es: "Desarrollo backend para Consum, en el sector de la distribución alimentaria.",
        va: "Desenvolupament backend per a Consum, en el sector de la distribució alimentària."
      }
    },
    {
      tier: "earlier",
      company: "Infoverity",
      role: "Software Engineer",
      period: { en: "Mar 2020 — Nov 2020", es: "Mar 2020 — Nov 2020", va: "Mar 2020 — Nov 2020" },
      summary: {
        en: "Data governance and internal tools software development.",
        es: "Desarrollo de software de gobierno del dato y herramientas internas.",
        va: "Desenvolupament de programari de govern de dades i ferramentes internes."
      }
    },
    {
      tier: "earlier",
      company: "F1-Connecting",
      role: { en: "Systems Technician", es: "Soporte de sistemas", va: "Suport de sistemes" },
      period: { en: "Feb 2019 — Sep 2019", es: "Feb 2019 — Sep 2019", va: "Feb 2019 — Set 2019" },
      summary: {
        en: "Contributed to a HelpDesk handling 8,000+ incidents per month.",
        es: "Participé en un HelpDesk que gestionaba más de 8.000 incidencias al mes.",
        va: "Vaig participar en un HelpDesk que gestionava més de 8.000 incidències al mes."
      }
    }
  ],

  skills: [
    {
      group: { en: "Languages & Frameworks", es: "Lenguajes y frameworks", va: "Llenguatges i frameworks" },
      items: ["Java 17+", "Spring", "Node.js", "TypeScript", { en: "REST APIs", es: "APIs REST", va: "API REST" }]
    },
    {
      group: { en: "Architecture", es: "Arquitectura", va: "Arquitectura" },
      items: ["Microservices", { en: "Hexagonal Architecture", es: "Arquitectura hexagonal", va: "Arquitectura hexagonal" }, "Domain-Driven Design"]
    },
    {
      group: { en: "Messaging & Data", es: "Mensajería y datos", va: "Missatgeria i dades" },
      items: ["Kafka", "RabbitMQ", "Oracle", "PostgreSQL", "MongoDB"]
    },
    {
      group: { en: "Cloud, DevOps & Runtime", es: "Cloud, DevOps y runtime", va: "Cloud, DevOps i runtime" },
      items: ["Kubernetes", "Datadog", "AWS"]
    },
    {
      group: { en: "AI & Agents", es: "IA y agentes", va: "IA i agents" },
      items: [
        "Claude Code", "OpenCode", "Claude API", "MCP",
        { en: "Skills & subagents", es: "Skills y subagentes", va: "Skills i subagents" },
        { en: "Agentic workflows", es: "Flujos agénticos", va: "Fluxos agèntics" }
      ]
    }
  ],

  certifications: [
    { name: "Claude Certified Architect — Professional" },
    { name: "Claude Certified Architect — Foundations" },
    { name: "Claude Certified Developer — Foundations" },
    { name: "AWS Certified Cloud Practitioner" },
    { name: "AWS Developer Associate", preparing: true },
    { name: "Spring Professional", preparing: true }
  ],

  languages: [
    { name: { en: "English", es: "Inglés", va: "Anglés" }, detail: "Cambridge B2 First" }
  ],

  education: {
    school: "Universitat Politècnica de València (UPV)",
    degree: { en: "BSc in Computer Engineering", es: "Grado en Ingeniería Informática", va: "Grau en Enginyeria Informàtica" },
    track: { en: "Information Technology", es: "Tecnologías de la Información", va: "Tecnologies de la Informació" }
  }
};

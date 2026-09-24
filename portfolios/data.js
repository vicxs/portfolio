// Portfolio content, rendered by portfolios/cabanyal.jsx
window.VICTOR = {
  name: "Victor Esteban",
  role: "Software Engineer",
  location: "Valencia, Spain",
  linkedin: "linkedin.com/in/victorestebann",
  github: "github.com/vicxs",
  linkedinUrl: "https://www.linkedin.com/in/victorestebann",
  githubUrl: "https://github.com/vicxs",
  cvUrl: "/portfolio/assets/Victor_Esteban_CV.pdf",

  lede: "Software engineer in Valencia working on backend, system integration and production support for Toyota Motor Europe, Inditex and Mercadona. Claude Certified Developer and Architect.",

  // Key figures under the hero. `value` counts up on scroll; `text` is shown as is.
  facts: [
    { value: 6, suffix: "+", label: "years in software engineering" },
    { value: 2, suffix: "M+", label: "API requests a day on the systems I maintain" },
    { value: 3, label: "Claude certifications, Developer and Architect" },
    { text: "Daily", label: "Claude Code in my engineering workflow" }
  ],

  personal: "I integrate well into teams and care about the environment around me. Outside work: sports, reading, films and series, and always learning something new.",

  experiences: [
    {
      tier: "main",
      company: "Xplore Group",
      client: "Toyota Motor Europe",
      role: "Software Engineer",
      period: "Nov 2024 — Present",
      location: "Valencia",
      summary: "Leading pan-European backend systems across product and dealer domains, serving high-traffic APIs that consolidate data for Toyota's European operations.",
      note: "High-traffic APIs serving 2M+ requests a day across product and dealer domains.",
      bullets: [
        "Maintained and evolved high-traffic APIs serving 2M+ requests/day across product and dealer domains.",
        "Drove technical solution design for cross-domain features and led integration with adjacent teams.",
        "Improved observability across services, reducing time-to-diagnose for production incidents.",
        "Owned legacy modernization work while keeping the system fully operational for dependent teams.",
        "Use Claude Code daily in delivery and help teammates adopt AI-assisted engineering workflows."
      ]
    },
    {
      tier: "main",
      company: "Plexus Tech",
      client: "Inditex",
      role: "Software Engineer",
      period: "Dec 2023 — Nov 2024",
      location: "Valencia",
      summary: "Backend engineer on production systems, contributing to a Kafka-based data aggregation platform that unified data exposure for downstream consumers.",
      bullets: [
        "Contributed to Kafka-based data aggregation feeding multiple downstream domains.",
        "Worked on production backend services with steady release cadence and on-call ownership.",
        "Helped shape consumer-facing data contracts used across the organization."
      ]
    },
    {
      tier: "main",
      company: "Mercadona",
      domain: "Logistics & Supply Chain",
      role: "Software Engineer",
      period: "Mar 2022 — Dec 2023",
      location: "Valencia",
      summary: "Backend engineer on logistics platforms, contributing to warehouse migrations, Kafka-based data unification, and legal-compliance workflows.",
      note: "A warehouse migration with strict consistency requirements and a minimal-downtime cutover.",
      bullets: [
        "Designed and shipped a Kafka-based data unification layer used across logistics services.",
        "Led a warehouse migration with strict consistency requirements and minimal downtime cutover.",
        "Built an inter-warehouse transfer solution coordinating multiple operational systems.",
        "Delivered a document-signing flow with cloud storage, replacing paper-based workflows and meeting legal compliance.",
        "Took technical decisions on integration patterns, message contracts, and rollout strategies."
      ]
    },
    {
      tier: "secondary",
      company: "Capgemini",
      role: "Software Engineer",
      period: "Jan 2021 — Mar 2022",
      summary: "Backend development for Consum, in the food retail sector."
    },
    {
      tier: "secondary",
      company: "Infoverity",
      role: "Software Engineer",
      period: "Mar 2020 — Nov 2020",
      summary: "Data governance and internal tools software development."
    },
    {
      tier: "secondary",
      company: "F1-Connecting",
      role: "Systems Technician",
      period: "Feb 2019 — Sept 2019",
      summary: "Contributed to a HelpDesk handling 8,000+ incidents per month."
    }
  ],

  ai: {
    intro: "AI is part of how I engineer, not a side topic. Claude Code is in my workflow every day, I build the skills and agents that make that work repeatable, and I look for places where agents can take real work off our processes.",
    certifications: [
      { role: "Architect", level: "Professional" },
      { role: "Architect", level: "Foundations" },
      { role: "Developer", level: "Foundations" }
    ],
    practice: [
      { title: "Claude Code, every day", text: "Implementing, refactoring, testing and reviewing code on the systems I work on, with the same standards I'd hold hand-written code to." },
      { title: "Skills and agents of my own", text: "Custom skills, subagents and project context that make AI-assisted work consistent and repeatable." },
      { title: "Agents for business processes", text: "Exploring agent-based solutions we can integrate into our company's processes." },
      { title: "Helping teams adopt it", text: "Sharing workflows and training colleagues so AI-assisted engineering becomes part of how the team works." }
    ]
  },

  projects: [
    {
      title: "Claude Code Custom Skills",
      summary: "Productivity skills for Claude Code that help me scope tasks, implement features end-to-end, review code, and triage dependency updates. I use them daily to keep my workflow fast and consistent."
    },
    {
      title: "Quick-diff-reviewer",
      summary: "A terminal diff reviewer: inspect changes hunk by hunk, annotate issues or self-fixes, and export structured JSON for CI or AI-assisted review workflows."
    }
  ],

  skills: [
    {
      group: "Languages & Frameworks",
      items: ["Java 17+", "Spring Boot", "Spring Security", "Spring Data", "Spring Batch", "Node.js", "TypeScript", "REST APIs"]
    },
    {
      group: "Architecture",
      items: ["Microservices", "Hexagonal Architecture", "Domain-Driven Design"]
    },
    {
      group: "Messaging & Data",
      items: ["Kafka", "RabbitMQ", "Oracle", "PostgreSQL", "MongoDB"]
    },
    {
      group: "Cloud, DevOps & Runtime",
      items: ["Kubernetes", "Datadog", "AWS"]
    },
    {
      group: "AI & Agents",
      items: ["Claude Code", "Claude API", "MCP", "Skills & subagents", "Agentic workflows"]
    }
  ],

  // Claude certifications are shown in the AI section.
  certifications: [
    "AWS Certified Cloud Practitioner",
    "English (Cambridge)",
    "Currently preparing — AWS Developer Associate",
    "Currently preparing — Spring Professional"
  ],

  education: {
    school: "Universitat Politècnica de València (UPV)",
    degree: "BSc in Computer Engineering",
    track: "Information Technology"
  }
};

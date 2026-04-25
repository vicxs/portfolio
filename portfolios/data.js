// Shared content for all portfolio variations
window.VICTOR = {
  name: "Victor Esteban",
  role: "Software Engineer",
  location: "Valencia, Spain",
  linkedin: "linkedin.com/in/victorestebann",
  github: "github.com/vicxs",
  linkedinUrl: "https://www.linkedin.com/in/victorestebann",
  githubUrl: "https://github.com/vicxs",
  cvUrl: "/portfolio/assets/Victor_Esteban_CV.pdf",

  hero: "I am a software engineer especially interested in turning ideas into well-implemented solutions, shipping reliable software, improving systems through observability, and using AI to improve productivity and deliver more value to clients.",

  about: [
    "I'm a software engineer with experience across backend development, system integration, and production support, with a strong focus on large-scale systems, reliability, observability, and practical solution design. I enjoy contributing across the full implementation cycle, from shaping technical solutions to maintaining them in production, and I'm always looking for ways to use AI to work more efficiently and create more value.",
    "I consider myself someone who integrates well into teams and is easy to work with. I care about building a good environment around me, and outside work I enjoy sports, reading, films and series, and staying in continuous learning."
  ],

  strengths: [
    "Backend development",
    "System integration",
    "Production support",
    "Observability",
    "Technical solution design",
    "Ownership in evolving teams",
    "Cross-team coordination",
    "AI for productivity"
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
    }
  ],

  experiences: [
    {
      tier: "main",
      company: "Xplore Group",
      client: "Toyota Motor Europe",
      role: "Software Engineer",
      period: "Nov 2024 — Present",
      location: "Valencia",
      summary: "Lead of pan-European backend systems across product and dealer domains, serving high-traffic APIs that consolidate data for Toyota's European operations.",
      bullets: [
        "Maintained and evolved high-traffic APIs serving 2M+ requests/day across product and dealer domains.",
        "Drove technical solution design for cross-domain features and led integration with adjacent teams.",
        "Improved observability across services, reducing time-to-diagnose for production incidents.",
        "Owned legacy modernization work while keeping the system fully operational for dependent teams.",
        "Onboarded fast into a complex environment and quickly took ownership of critical components."
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
      client: "Logistics & Supply Chain",
      role: "Software Engineer",
      period: "Mar 2022 — Dec 2023",
      location: "Valencia",
      summary: "Backend engineer on logistics platforms, contributing to warehouse migrations, Kafka-based data unification, and legal-compliance workflows.",
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

  projects: [
    {
      title: "Claude Code Custom Skills",
      summary: "Custom productivity skills for Claude Code that help me scope tasks, implement features end-to-end, review code, and triage dependency updates. I use them daily to improve my own productivity and keep my workflow consistent."
    },
    {
      title: "Quick-diff-reviewer",
      summary: "A terminal-based diff review tool that lets me inspect code changes hunk by hunk, annotate issues or self-fixes, and export structured JSON for downstream automation in CI or AI-assisted review workflows."
    },
    {
      title: "Personal Portfolio",
      summary: "My own portfolio website, built with AI assistance, designed to showcase my experience, projects, and engineering focus in a clear and professional way."
    }
  ],

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

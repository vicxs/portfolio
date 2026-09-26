// Shapes of the portfolio content in data.ts and the interface copy in i18n.ts.

export const LANGS = ['en', 'es', 'va'] as const;
export type Lang = (typeof LANGS)[number];
export const DEFAULT_LANG: Lang = 'en';
/** The HTML lang attribute for each language; Valencian is ca-valencia. */
export const HTML_LANG: Record<Lang, string> = { en: 'en', es: 'es', va: 'ca-valencia' };

/** A value shared by every language, or one per language. */
export type Localized<T> = T | Record<Lang, T>;

/** Content with every { en, es, va } triple replaced by the text for one language. */
export type Resolved<T> =
  T extends Record<Lang, infer U> ? U
  : T extends readonly (infer I)[] ? Resolved<I>[]
  : T extends object ? { [K in keyof T]: Resolved<T[K]> }
  : T;

export interface Fact {
  label: Localized<string>;
  value: Localized<string>;
  sub?: Localized<string>;
  /** Adds the pulsing dot. */
  live?: boolean;
}

interface ExperienceBase {
  company: string;
  role: Localized<string>;
  period: Localized<string>;
  summary: Localized<string>;
}

/** A full row in Work, with its contributions and an optional margin note. */
export interface MainExperience extends ExperienceBase {
  tier: 'main';
  client?: string;
  domain?: Localized<string>;
  current?: boolean;
  location?: string;
  note?: Localized<string>;
  bullets: Localized<string[]>;
}

/** A one-line row (secondary), or an entry in the grouped earlier roles. */
export interface BriefExperience extends ExperienceBase {
  tier: 'secondary' | 'earlier';
}

export type Experience = MainExperience | BriefExperience;

export interface SkillGroup {
  group: Localized<string>;
  items: Localized<string>[];
}

export interface Certification {
  name: string;
  preparing?: boolean;
}

export interface SpokenLanguage {
  name: Localized<string>;
  detail: string;
}

export interface Education {
  school: string;
  degree: Localized<string>;
  track: Localized<string>;
}

export interface Portfolio {
  name: string;
  role: string;
  location: Localized<string>;
  linkedin: string;
  github: string;
  linkedinUrl: string;
  githubUrl: string;
  email: string;
  emailUrl: string;
  cvUrl: Record<Lang, string>;
  lede: Localized<string>;
  facts: Fact[];
  experiences: Experience[];
  skills: SkillGroup[];
  certifications: Certification[];
  languages: SpokenLanguage[];
  education: Education;
}

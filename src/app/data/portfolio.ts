export interface Profile {
  name: string;
  role: string;
  location: string;
  tagline: string;
  summary: string[];
  email: string;
  github: string;
  githubUser: string;
  linkedin: string;
  linkedinUser: string;
}

export interface Job {
  company: string;
  role: string;
  location: string;
  period: string;
  current?: boolean;
  highlights: { label: string; text: string }[];
  stack: string[];
}

export interface Project {
  name: string;
  blurb: string;
  language: string;
  stack: string[];
  /** Source repository. Omit for closed-source work — the card drops the GitHub link. */
  repo?: string;
  /** Live, playable deployment. */
  demo?: string;
  /** Docs, a write-up or a recorded walkthrough — for projects whose code stays private. */
  learnMore?: string;
  featured?: boolean;
}

export interface SkillGroup {
  title: string;
  items: string[];
}

export interface Course {
  title: string;
  issuer: string;
  detail: string;
  period: string;
}

export const PROFILE: Profile = {
  name: 'Matheus Cezário',
  role: 'Senior Software Engineer',
  location: 'Sinop, Brazil',
  tagline: 'Fullstack engineer building systems that survive production.',
  summary: [
    'I have spent the last five years working across the stack — Angular, React and React Native on the front, Python, C# and Go on the back — mostly on systems that were already live, already loaded and already mattered to someone.',
    'Most of my work sits where performance, legacy code and architecture meet: a 400% throughput gain from an edge cache, a monolith split into services over RabbitMQ, a Python 2 codebase carried into Python 3. Today I build the Workflow engine at Netlex, a graph system that drives the entire document lifecycle.',
  ],
  email: 'mcezario11@gmail.com',
  github: 'https://github.com/Matheus-Cezario',
  githubUser: 'Matheus-Cezario',
  linkedin: 'https://www.linkedin.com/in/matheus-cezario-santos-0176a71b0/',
  linkedinUser: 'matheus-cezario-santos',
};

export const JOBS: Job[] = [
  {
    company: 'Netlex',
    role: 'Senior Software Engineer',
    location: 'Belo Horizonte, Brazil',
    period: 'Nov 2025 — Present',
    current: true,
    highlights: [
      {
        label: 'Fullstack Development',
        text: 'Building the Workflow feature — a graph-based system that manages the entire document lifecycle, from creation through signature to archival.',
      },
    ],
    stack: ['Fullstack', 'Graph systems', 'Document lifecycle'],
  },
  {
    company: 'Geekie',
    role: 'Mid-level Software Engineer',
    location: 'São Paulo, Brazil',
    period: 'Dec 2023 — Oct 2025',
    highlights: [
      {
        label: 'Performance',
        text: 'Designed an edge cache for a legacy system buckling under request volume, boosting performance by 400%.',
      },
      {
        label: 'Microservices',
        text: 'Used RabbitMQ to break a monolith into services, improving scalability and isolating failure domains.',
      },
      {
        label: 'Legacy upgrades',
        text: 'Contributed to the Python 2 to Python 3 migration, bringing long-lived systems back onto a supported runtime.',
      },
      {
        label: 'Data migration',
        text: 'Built applications to move data between systems, alongside ongoing feature work and bug fixing on heavily used legacy code.',
      },
    ],
    stack: ['Python', 'RabbitMQ', 'AWS', 'Event-driven'],
  },
  {
    company: 'Geekie',
    role: 'Junior Software Engineer',
    location: 'São Paulo, Brazil',
    period: 'May 2022 — Dec 2023',
    highlights: [
      {
        label: 'Fullstack Development',
        text: 'Developed and maintained educational applications used by students and teachers, on both web and mobile.',
      },
    ],
    stack: ['React', 'React Native', 'Python'],
  },
  {
    company: 'PSV Engenharia de Sistemas',
    role: 'Mid-level Software Engineer',
    location: 'Ouro Branco, Brazil',
    period: 'Dec 2021 — May 2022',
    highlights: [
      {
        label: 'Fullstack Development',
        text: 'Created an online resource and production control system from the ground up, with Angular on the front and C# on the back.',
      },
    ],
    stack: ['Angular', 'C#', 'SQL'],
  },
  {
    company: 'PSV Engenharia de Sistemas',
    role: 'Junior Software Engineer',
    location: 'Ouro Branco, Brazil',
    period: 'Jan 2021 — Dec 2021',
    highlights: [
      {
        label: 'Legacy Systems',
        text: 'Maintained and modernised a production control system written in ASP Classic, still running the shop floor day to day.',
      },
    ],
    stack: ['ASP Classic', 'SQL'],
  },
];

export const PROJECTS: Project[] = [
  {
    name: 'FakeBase',
    blurb:
      'Spins up a whole fake database from a single JSON schema and serves it over a REST API — for prototyping screens, seeding test environments or demoing an app with no backend at all. Version 2 moved storage into an embedded NoSQL engine, so the routes gained real filters, sorting, projection and pagination.',
    language: 'Python',
    stack: ['Python', 'MontyDB', 'REST API', 'Swagger'],
    repo: 'https://github.com/Matheus-Cezario/FakeBase',
    featured: true,
  },
  {
    name: 'Hidden Time',
    blurb:
      'A blind timing game. You are given a target — say five seconds — then start a stopwatch you cannot see and stop when you think you got there. Deliberately animation-free while running: any steady pulse would leak the tempo and ruin the game.',
    language: 'Dart',
    stack: ['Flutter', 'Dart', 'Local storage'],
    repo: 'https://github.com/Matheus-Cezario/hidden-time',
    featured: true,
  },
  {
    name: 'dataGenerate',
    blurb:
      'A random data generator compiled to WebAssembly from Go. Feed it a JSON config and it produces structured fake records straight in the browser, with no server round trip.',
    language: 'Go',
    stack: ['Go', 'WebAssembly', 'JavaScript'],
    repo: 'https://github.com/Matheus-Cezario/dataGenerate',
  },
  {
    name: 'Bla Bla Bla In English',
    blurb:
      'A vocabulary trainer for English learners. Questions are generated by AI rather than pulled from a fixed bank, so the words keep coming and adapt to what you are actually learning instead of running out after a few rounds.',
    language: 'Dart',
    stack: ['Flutter', 'Dart', 'AI'],
    repo: 'https://github.com/Matheus-Cezario/bla-bla-in-english',
    featured: true,
  },
  {
    // Closed source: fill `learnMore` with the docs or demo URL once it is published.
    name: 'OW Editor',
    blurb:
      'Upload a match recording and get the highlights back as finished videos. Python microservices detect the moments worth keeping and cut them together, while a Flutter app — mobile-first, but at home on the web — tracks the analysis and plays the results.',
    language: 'Dart',
    stack: ['Flutter', 'Python', 'Microservices', 'Video processing'],
    repo: 'https://github.com/Matheus-Cezario/ow-automatic-editor-backend',
  },
];

export const SKILLS: SkillGroup[] = [
  {
    title: 'Languages',
    items: [
      'Python',
      'TypeScript',
      'JavaScript',
      'C#',
      'Java',
      'Go',
      'Dart',
      'ASP Classic',
    ],
  },
  {
    title: 'Frontend',
    items: ['Angular', 'React', 'React Native', 'Next.js', 'Flutter', 'SCSS'],
  },
  {
    title: 'Backend & Data',
    items: ['RabbitMQ', 'REST APIs', 'SQL', 'MongoDB', 'Data migration'],
  },
  {
    title: 'Platform & Practices',
    items: [
      'AWS',
      'Event-driven architecture',
      'Microservices',
      'Caching',
      'Legacy modernisation',
    ],
  },
];

export const COURSES: Course[] = [
  {
    title: 'Mechatronics, Robotics and Control & Automation Engineering',
    issuer: 'Universidade Federal de São João del-Rei — UFSJ',
    detail: 'Ouro Branco, MG, Brazil · incomplete',
    period: '2018 — 2021',
  },
  {
    title: 'Angular',
    issuer: 'Loiane Groner',
    detail: '28 hours',
    period: 'Mar 2022',
  },
  {
    title: 'Go (Golang)',
    issuer: 'Udemy',
    detail: '11.5 hours',
    period: 'Mar 2022',
  },
  {
    title: 'Complete Java',
    issuer: 'Udemy',
    detail: '33.5 hours',
    period: 'Dec 2018',
  },
];

export const LANGUAGE_COLORS: Record<string, string> = {
  Python: '#3572a5',
  TypeScript: '#3178c6',
  JavaScript: '#f1e05a',
  Dart: '#00b4ab',
  Go: '#00add8',
  Java: '#b07219',
};

export const STATS = [
  { value: '5+', label: 'Years shipping software' },
  { value: '400%', label: 'Throughput gain from one cache' },
  {
    value: 'AI',
    label: 'MCP infrastructure connecting AI to an existing system',
  },
];

/**
 * Spanish transcription of the CV-sync summary (`summary.json`), keyed by
 * the exact English string it translates. This is a translation layer, not
 * a fact source: every key below is copied verbatim from
 * `apps/site/public/downloads/cv/summary.json` at the time this was
 * written, and every value is a faithful, genuinely editorial Spanish
 * rendering of that exact fact — never a new claim.
 *
 * If a future `pnpm cv:sync` changes the underlying English wording, the
 * exact-string lookup below simply stops matching for that entry.
 * `translateResumeText` degrades to the English original with
 * `translated: false` in that case (see `/es/cv/`), rather than either
 * crashing the build or fabricating a Spanish sentence for text nobody
 * reviewed — an intentional, honest "not yet translated" fallback.
 *
 * Certification titles and proper nouns (organisation names, product/course
 * names) are deliberately left untranslated, matching
 * `content/site/credentials.yaml`'s convention that credential titles are
 * proper nouns, not prose.
 */
export const RESUME_ES_TRANSLATIONS: Readonly<Record<string, string>> = {
  "AI Engineering · Data Science": "Ingeniería de IA · Ciencia de Datos",
  "Mexico City, MX": "Ciudad de México, MX",
  "Open to remote & relocation": "Disponible para trabajo remoto o reubicación",
  "Final-year BSc Data Science student with AI engineering experience building enterprise agent governance, RAG and agentic systems. Seeking AI/ML engineering and data science roles.":
    "Estudiante del último año de la licenciatura en Ciencia de Datos, con experiencia en ingeniería de IA construyendo gobernanza de agentes empresariales, sistemas RAG y agénticos. Busca roles de ingeniería en IA/ML y ciencia de datos.",

  "AI Engineering Intern": "Becario de Ingeniería de IA",
  "Feb 2026 – Aug 2026": "Feb 2026 – Ago 2026",
  "Bangalore, India": "Bangalore, India",
  "Engineered the Identity Module and DID/Credential service for an Agent Governance Framework, implementing W3C did:web and did:key identities, Ed25519 signing and credential issuance and validation":
    "Diseñó el módulo de identidad y el servicio de credenciales DID para un framework de gobernanza de agentes, implementando identidades W3C did:web y did:key, firma Ed25519 y la emisión y validación de credenciales",
  "Architected Pydantic v2 models and async PostgreSQL persistence with SQLAlchemy and Alembic for multi-tenant agent registration, identity resolution and lifecycle controls":
    "Diseñó la arquitectura de modelos Pydantic v2 y persistencia asíncrona en PostgreSQL con SQLAlchemy y Alembic para el registro de agentes multi-tenant, la resolución de identidad y los controles de ciclo de vida",
  "Co-developed the trust layer with 3 engineers, integrating OPA/Rego policy gates, Merkle-tree audit evidence and OpenTelemetry observability across the agent execution flow":
    "Co-desarrolló la capa de confianza junto con 3 ingenieros, integrando puertas de política OPA/Rego, evidencia de auditoría con árboles de Merkle y observabilidad con OpenTelemetry en todo el flujo de ejecución de agentes",
  "Led the presentations through 3 review stages, including a session with Infosys founder N. R. Narayana Murthy and CTO Rafee Tarafdar; placed 3rd among 6 finalists from ~30 teams at InStep Project Fest 2026":
    "Encabezó las presentaciones a lo largo de 3 etapas de revisión, incluida una sesión con el fundador de Infosys, N. R. Narayana Murthy, y el CTO Rafee Tarafdar; quedó en 3er lugar entre 6 finalistas de ~30 equipos en el InStep Project Fest 2026",
  "Built a Multimodal RAG Research Assistant with document/image embeddings and a Data Analyst Agent executing sandboxed pandas code from natural-language queries, during AI-First Engineering training":
    "Construyó un asistente de investigación RAG multimodal con embeddings de documentos e imágenes, y un agente analista de datos que ejecutaba código pandas en un entorno aislado a partir de consultas en lenguaje natural, durante la capacitación AI-First Engineering",

  "Sensor Analytics & AI Explain": "Analítica de sensores y explicación con IA",
  "Aug 2025": "Ago 2025",
  "Led the data and product stream in a cross-disciplinary team of 8, defining pipelines and mould-risk logic for temperature, humidity and VOC sensor data":
    "Encabezó el eje de datos y producto en un equipo multidisciplinario de 8 personas, definiendo pipelines y la lógica de riesgo de moho a partir de datos de sensores de temperatura, humedad y compuestos orgánicos volátiles (VOC)",
  "Prototyped a 6-screen web app with AI-generated anomaly explanations and presented the concept in the programme's final pitch":
    "Prototipó una aplicación web de 6 pantallas con explicaciones de anomalías generadas por IA, y presentó el concepto en el pitch final del programa",

  "RAG on Azure OpenAI": "RAG sobre Azure OpenAI",
  "Dec 2024 – Jan 2025": "Dic 2024 – Ene 2025",
  "Fine-tuned a GPT-4 deployment and configured 3 Azure AI Search indexes for grounded, personalised nutrition guidance across articles, nutrient data and recipes":
    "Ajustó (fine-tuning) un despliegue de GPT-4 y configuró 3 índices de Azure AI Search para ofrecer orientación nutricional personalizada y fundamentada a partir de artículos, datos de nutrientes y recetas",
  "Orchestrated JSONL, PDF and CSV ingestion to Azure Blob Storage, added text-to-speech and achieved 4.58/5 average satisfaction in pilot testing":
    "Orquestó la ingesta de archivos JSONL, PDF y CSV hacia Azure Blob Storage, agregó texto a voz y alcanzó una satisfacción promedio de 4.58/5 en las pruebas piloto",

  "Retail Analytics Dashboard": "Dashboard de analítica de retail",
  "Oct 2024 – Jan 2025": "Oct 2024 – Ene 2025",
  "Modelled a star schema and delivered a 3-page Qlik dashboard with 5 filters and YoY KPIs; earned 9/10 in a course led by KPMG Mexico's Head of Tax Technology":
    "Modeló un esquema en estrella y entregó un dashboard de Qlik de 3 páginas con 5 filtros y KPIs interanuales; obtuvo 9/10 en un curso impartido por la Head of Tax Technology de KPMG México",

  "BSc Data Science": "Licenciatura en Ciencia de Datos",
  "Aug 2022 – Expected 2027": "Ago 2022 – 2027 (estimado)",
  "GPA: 9.29/10": "Promedio: 9.29/10",
  "Academic Exchange": "Intercambio académico",
  "Sep 2025 – Jan 2026": "Sep 2025 – Ene 2026",
  "London, UK": "Londres, Reino Unido",
  "Introduction to AI (A), Multi-Platform Game Development (B)":
    "Introducción a la IA (A), Desarrollo de Videojuegos Multiplataforma (B)",

  Programming: "Programación",
  "Python, SQL, C#": "Python, SQL, C#",
  "AI/ML": "IA/ML",
  "LangChain, LangGraph, RAG, LLM fine-tuning, Multi-Agent Orchestration, Claude Agent SDK, scikit-learn, pandas, NumPy":
    "LangChain, LangGraph, RAG, ajuste fino de LLM, orquestación multiagente, Claude Agent SDK, scikit-learn, pandas, NumPy",
  "Governance & Backend": "Gobernanza y backend",
  "AI Governance, W3C DIDs/VCs, OPA/Rego, Pydantic, FastAPI, SQLAlchemy/Alembic, PostgreSQL":
    "Gobernanza de IA, W3C DIDs/VCs, OPA/Rego, Pydantic, FastAPI, SQLAlchemy/Alembic, PostgreSQL",
  "Cloud & Tools": "Nube y herramientas",
  "Azure OpenAI, AI Search, Blob Storage, GCP foundations, Docker, Git, Linux, OpenTelemetry":
    "Azure OpenAI, AI Search, Blob Storage, fundamentos de GCP, Docker, Git, Linux, OpenTelemetry",
  Languages: "Idiomas",
  "Spanish (native), English (C1 – PTE Academic 83/90)":
    "Español (nativo), inglés (C1 – PTE Academic 83/90)",
};

export interface ResumeTextTranslation {
  readonly value: string;
  readonly translated: boolean;
}

/**
 * Certification titles are proper nouns (content.mdc, credentials.yaml) and
 * intentionally pass through unchanged in both languages.
 */
export function translateResumeText(source: string): ResumeTextTranslation {
  const translated = RESUME_ES_TRANSLATIONS[source];
  if (translated === undefined) {
    return { value: source, translated: false };
  }
  return { value: translated, translated: true };
}

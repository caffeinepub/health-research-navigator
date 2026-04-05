import type { Study } from "../types/study";

// Reconstruct abstract from OpenAlex inverted index
export function reconstructAbstract(
  invertedIndex: Record<string, number[]> | null | undefined,
): string {
  if (!invertedIndex) return "";
  const entries: [string, number][] = [];
  for (const [word, positions] of Object.entries(invertedIndex)) {
    for (const pos of positions) {
      entries.push([word, pos]);
    }
  }
  entries.sort((a, b) => a[1] - b[1]);
  return entries.map(([word]) => word).join(" ");
}

// Extract key findings from abstract
export function extractKeyFindings(abstract: string): string {
  if (!abstract) return "";
  const findingKeywords = [
    "found",
    "showed",
    "demonstrated",
    "significantly",
    "associated",
    "result",
    "conclude",
    "suggest",
    "indicated",
    "revealed",
    "reported",
  ];
  const sentences = abstract
    .split(/[.!?]+/)
    .filter((s) => s.trim().length > 20);
  const findings = sentences.filter((s) =>
    findingKeywords.some((kw) => s.toLowerCase().includes(kw)),
  );
  if (findings.length === 0) return `${sentences.slice(0, 2).join(". ")}.`;
  return `${findings.slice(0, 2).join(". ")}.`;
}

// Extract research gaps / general limitations from abstract
export function extractResearchGaps(abstract: string): string {
  if (!abstract) return "";
  const gapKeywords = [
    "limitation",
    "gap",
    "further research",
    "future studies",
    "lack of",
    "limited",
    "unclear",
    "unknown",
    "warrant",
    "needed",
    "insufficient",
    "no studies",
    "few studies",
    "remains to be",
  ];
  const sentences = abstract
    .split(/[.!?]+/)
    .filter((s) => s.trim().length > 20);
  const gaps = sentences.filter((s) =>
    gapKeywords.some((kw) => s.toLowerCase().includes(kw)),
  );
  if (gaps.length === 0) return "";
  return `${gaps.slice(0, 2).join(". ")}.`;
}

// Extract future research recommendations explicitly advised by the authors
export function extractFutureResearch(abstract: string): string {
  if (!abstract) return "";
  const futureKeywords = [
    "future research",
    "future studies",
    "future work",
    "further research",
    "further studies",
    "further investigation",
    "warrant further",
    "are needed",
    "should be explored",
    "should investigate",
    "should examine",
    "recommend",
    "we suggest",
    "we propose",
    "future trials",
    "longitudinal studies",
    "prospective studies are",
    "more research",
    "additional research",
  ];
  const sentences = abstract
    .split(/[.!?]+/)
    .filter((s) => s.trim().length > 20);
  const future = sentences.filter((s) =>
    futureKeywords.some((kw) => s.toLowerCase().includes(kw)),
  );
  if (future.length === 0) return "";
  return `${future.slice(0, 2).join(". ")}.`;
}

// Extract limitations that the author explicitly acknowledged about their own study
export function extractAuthorLimitations(abstract: string): string {
  if (!abstract) return "";
  const limitKeywords = [
    "our study",
    "this study",
    "our findings",
    "the present study",
    "this review",
    "our review",
    "our analysis",
    "this analysis",
    "limitation of",
    "limitations of",
    "limited by",
    "we acknowledge",
    "small sample",
    "sample size",
    "selection bias",
    "recall bias",
    "cross-sectional",
    "unable to",
    "could not",
    "retrospective",
    "self-reported",
    "single centre",
    "single center",
    "generalizability",
    "generaliz",
  ];
  const sentences = abstract
    .split(/[.!?]+/)
    .filter((s) => s.trim().length > 20);
  const authorLimits = sentences.filter((s) =>
    limitKeywords.some((kw) => s.toLowerCase().includes(kw)),
  );
  if (authorLimits.length === 0) return "";
  return `${authorLimits.slice(0, 2).join(". ")}.`;
}

// Format Vancouver reference
export function formatVancouver(study: Study): string {
  const authors =
    study.authors.length === 0
      ? "Unknown"
      : study.authors.length <= 3
        ? study.authors.join(", ")
        : `${study.authors.slice(0, 3).join(", ")} et al`;
  const title = study.title.trim();
  const journal = study.journal || "";
  const year = study.year || "";
  let volPages = "";
  if (study.volume && study.pages) {
    volPages = `;${study.volume}:${study.pages}`;
  } else if (study.volume) {
    volPages = `;${study.volume}`;
  }
  const doi = study.doi ? `. DOI: ${study.doi}` : "";
  return `${authors}. ${title}. ${journal}. ${year}${volPages}${doi}`;
}

// Detect framework from abstract
export function detectFramework(
  abstract: string,
  gaps: string,
): "PICO" | "PECO" | "SPIDER" | "ECLIPSE" {
  const text = `${abstract} ${gaps}`.toLowerCase();
  const eclipseScore = [
    "health service",
    "policy",
    "management",
    "administration",
    "healthcare system",
    "service delivery",
    "health system",
  ].filter((k) => text.includes(k)).length;
  const spiderScore = [
    "qualitative",
    "experience",
    "perception",
    "attitude",
    "lived experience",
    "thematic",
    "phenomenological",
    "narrative",
    "grounded theory",
  ].filter((k) => text.includes(k)).length;
  const pecoScore = [
    "exposure",
    "environmental",
    "risk factor",
    "occupational",
    "dietary",
    "diet",
    "pollutant",
    "chemical",
  ].filter((k) => text.includes(k)).length;
  const picoScore = [
    "intervention",
    "treatment",
    "therapy",
    "drug",
    "medication",
    "comparison",
    "control group",
    "randomized",
    "rct",
    "clinical trial",
  ].filter((k) => text.includes(k)).length;

  const scores: [number, "PICO" | "PECO" | "SPIDER" | "ECLIPSE"][] = [
    [picoScore, "PICO"],
    [pecoScore, "PECO"],
    [spiderScore, "SPIDER"],
    [eclipseScore, "ECLIPSE"],
  ];
  scores.sort((a, b) => b[0] - a[0]);
  return scores[0][1];
}

// Get framework components for a study
export function getFrameworkComponents(
  study: Study,
  framework: "PICO" | "PECO" | "SPIDER" | "ECLIPSE",
): Record<string, string> {
  const text = study.abstract;
  const area = study.journal || study.source;

  if (framework === "PICO") {
    return {
      P: "Patients/population mentioned in study",
      I:
        extractPhrase(text, ["intervention", "treatment", "therapy", "drug"]) ||
        study.title.split(" ").slice(0, 4).join(" "),
      C:
        extractPhrase(text, [
          "compared to",
          "versus",
          "control",
          "comparison",
        ]) || "Standard care / placebo",
      O:
        extractPhrase(text, [
          "outcome",
          "result",
          "effect",
          "mortality",
          "morbidity",
        ]) || "Clinical outcome",
    };
  }
  if (framework === "PECO") {
    return {
      P: "Population in study",
      E:
        extractPhrase(text, [
          "exposure",
          "exposed",
          "diet",
          "environment",
          "chemical",
          "risk",
        ]) || "Environmental/dietary exposure",
      C:
        extractPhrase(text, ["unexposed", "control", "comparison"]) ||
        "Unexposed comparator",
      O:
        extractPhrase(text, [
          "outcome",
          "health effect",
          "incidence",
          "prevalence",
        ]) || "Health outcome",
    };
  }
  if (framework === "SPIDER") {
    return {
      S: `Sample group from ${area}`,
      PI:
        extractPhrase(text, [
          "experience",
          "perception",
          "attitude",
          "view",
          "perspective",
        ]) || study.title,
      D:
        extractPhrase(text, [
          "qualitative",
          "interview",
          "focus group",
          "thematic",
        ]) || "Qualitative design",
      E:
        extractPhrase(text, ["theme", "finding", "category", "perspective"]) ||
        "Themes and experiences",
      R: "Qualitative research",
    };
  }
  // ECLIPSE
  return {
    E:
      extractPhrase(text, ["expectation", "improve", "goal", "aim"]) ||
      "Improved service delivery",
    C: "Healthcare users/patients",
    L:
      extractPhrase(text, [
        "hospital",
        "clinic",
        "community",
        "primary care",
        "setting",
      ]) || "Healthcare setting",
    I:
      extractPhrase(text, ["impact", "outcome", "effect", "result"]) ||
      "Service impact",
    P:
      extractPhrase(text, [
        "clinician",
        "nurse",
        "doctor",
        "professional",
        "staff",
      ]) || "Healthcare professionals",
    SE:
      extractPhrase(text, ["service", "program", "intervention", "system"]) ||
      "Health service",
  };
}

function extractPhrase(text: string, keywords: string[]): string {
  const lower = text.toLowerCase();
  for (const kw of keywords) {
    const idx = lower.indexOf(kw);
    if (idx !== -1) {
      const start = Math.max(0, idx - 10);
      const end = Math.min(text.length, idx + kw.length + 60);
      return text
        .slice(start, end)
        .trim()
        .replace(/[.,;].*$/, "");
    }
  }
  return "";
}

// Generate research question from framework and broad area
export function generateResearchQuestions(
  broadArea: string,
  classifiedGaps: { framework: string; study: Study }[],
): { text: string; framework: string; rationale: string }[] {
  // Count frameworks
  const counts: Record<string, number> = {};
  for (const g of classifiedGaps) {
    counts[g.framework] = (counts[g.framework] || 0) + 1;
  }

  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const dominant = sorted[0]?.[0] || "PICO";

  // Extract population hint from broad area
  const area = broadArea.trim() || "the study population";

  const questions: { text: string; framework: string; rationale: string }[] =
    [];

  if (dominant === "PICO" || sorted.find((s) => s[0] === "PICO")) {
    questions.push({
      text: `In patients with ${area}, does the intervention improve clinical outcomes compared to standard care?`,
      framework: "PICO",
      rationale: `The majority of reviewed studies used interventional designs. A PICO-framed question addresses the identified gap by comparing an intervention against current practice in ${area}.`,
    });
  }
  if (dominant === "PECO" || sorted.find((s) => s[0] === "PECO")) {
    questions.push({
      text: `In the population affected by ${area}, is the identified exposure associated with adverse health outcomes compared to an unexposed group?`,
      framework: "PECO",
      rationale: `Several studies identified environmental or exposure-based gaps in ${area}. This PECO question addresses the exposure-outcome relationship.`,
    });
  }
  if (dominant === "SPIDER" || sorted.find((s) => s[0] === "SPIDER")) {
    questions.push({
      text: `What are the experiences and perceptions of individuals living with ${area} regarding available healthcare services?`,
      framework: "SPIDER",
      rationale: `Qualitative gaps were noted in the literature. A SPIDER framework captures experiential and perceptual dimensions in ${area} that quantitative studies miss.`,
    });
  }
  if (dominant === "ECLIPSE" || sorted.find((s) => s[0] === "ECLIPSE")) {
    questions.push({
      text: `How does healthcare service delivery for ${area} impact patient outcomes across different settings from the perspective of healthcare professionals?`,
      framework: "ECLIPSE",
      rationale: `Health service gaps were identified in the literature on ${area}. This ECLIPSE question addresses service delivery and professional perspective.`,
    });
  }

  // Always ensure at least 3 questions
  if (questions.length < 3) {
    const frameworks: ("PICO" | "PECO" | "SPIDER")[] = [
      "PICO",
      "PECO",
      "SPIDER",
    ];
    for (const fw of frameworks) {
      if (questions.find((q) => q.framework === fw)) continue;
      if (fw === "PICO") {
        questions.push({
          text: `In patients with ${area}, does a structured intervention reduce disease burden compared to no intervention?`,
          framework: "PICO",
          rationale: `Based on gaps identified across the searched literature, an interventional study using PICO would directly address the unmet clinical need in ${area}.`,
        });
      } else if (fw === "PECO") {
        questions.push({
          text: `Is exposure to key risk factors in ${area} associated with increased incidence compared to non-exposed populations?`,
          framework: "PECO",
          rationale: `Epidemiological gaps on risk factor associations in ${area} are underexplored. PECO provides a rigorous structure for this observational question.`,
        });
      } else {
        questions.push({
          text: `What are the lived experiences of healthcare providers managing ${area} in low-resource settings?`,
          framework: "SPIDER",
          rationale: `The qualitative dimension of ${area} remains understudied. SPIDER captures rich experiential data from a specific sample.`,
        });
      }
      if (questions.length >= 3) break;
    }
  }

  return questions.slice(0, 4);
}

// ── Deduplication ──────────────────────────────────────────────────────────────────

// Source priority order for deduplication (keep highest-priority source)
const SOURCE_PRIORITY = [
  "pubmed",
  "europepmc",
  "europe pmc",
  "semanticscholar",
  "semantic scholar",
  "consensus",
  "openalex",
  "arxiv",
  "eric",
  "googlescholar",
  "google scholar",
  "shodhganga",
];

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function sourcePriority(source: string): number {
  const s = source.toLowerCase();
  const idx = SOURCE_PRIORITY.findIndex((p) => s.includes(p));
  return idx === -1 ? 999 : idx;
}

export interface DeduplicationResult {
  studies: Study[];
  duplicatesRemoved: number;
  duplicateDetails: { title: string; sources: string[] }[];
}

export function deduplicateStudies(studies: Study[]): DeduplicationResult {
  const doiMap = new Map<string, Study>();
  const titleMap = new Map<string, Study>();
  const mergedSources = new Map<string, Set<string>>();
  const duplicates: { title: string; sources: string[] }[] = [];

  // First pass: build maps preferring higher-priority sources
  for (const study of studies) {
    const doi = study.doi?.trim().toLowerCase();
    const normTitle = normalizeTitle(study.title);

    let existingStudy: Study | null = null;

    if (doi && doi.length > 5) {
      existingStudy = doiMap.get(doi) ?? null;
    }

    if (!existingStudy && normTitle.length > 10) {
      existingStudy = titleMap.get(normTitle) ?? null;
    }

    if (existingStudy) {
      // It's a duplicate — merge sources
      const setKey = existingStudy.id;
      if (!mergedSources.has(setKey)) {
        mergedSources.set(setKey, new Set([existingStudy.source]));
      }
      mergedSources.get(setKey)!.add(study.source);

      duplicates.push({
        title: study.title,
        sources: Array.from(mergedSources.get(setKey)!),
      });

      // If current study has higher priority source, replace it
      if (sourcePriority(study.source) < sourcePriority(existingStudy.source)) {
        const newStudy = { ...study };
        if (doi && doi.length > 5) doiMap.set(doi, newStudy);
        if (normTitle.length > 10) titleMap.set(normTitle, newStudy);
        const sources = mergedSources.get(setKey)!;
        mergedSources.delete(setKey);
        mergedSources.set(newStudy.id, sources);
      }
    } else {
      // New unique study
      if (doi && doi.length > 5) doiMap.set(doi, study);
      if (normTitle.length > 10) titleMap.set(normTitle, study);
    }
  }

  // Collect unique studies
  const seenIds = new Set<string>();
  const unique: Study[] = [];

  for (const study of studies) {
    const doi = study.doi?.trim().toLowerCase();
    const normTitle = normalizeTitle(study.title);

    let canonical: Study | null = null;
    if (doi && doi.length > 5) canonical = doiMap.get(doi) ?? null;
    if (!canonical && normTitle.length > 10)
      canonical = titleMap.get(normTitle) ?? null;
    if (!canonical) canonical = study;

    if (!seenIds.has(canonical.id)) {
      seenIds.add(canonical.id);
      const sources = mergedSources.get(canonical.id);
      if (sources && sources.size > 1) {
        unique.push({ ...canonical, source: Array.from(sources).join(", ") });
      } else {
        unique.push(canonical);
      }
    }
  }

  return {
    studies: unique,
    duplicatesRemoved: studies.length - unique.length,
    duplicateDetails: duplicates,
  };
}

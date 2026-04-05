export interface Study {
  id: string;
  title: string;
  authors: string[];
  journal: string;
  year: number;
  volume?: string;
  pages?: string;
  doi?: string;
  abstract: string;
  source: string;
  keyFindings?: string;
  researchGaps?: string;
  futureResearch?: string;
  authorLimitations?: string;
  gapFramework?: string;
}

export interface SynthesisRow {
  srlNo: number;
  vancouverRef: string;
  keyFindings: string;
  researchGaps: string;
  futureResearch: string;
  authorLimitations: string;
  study: Study;
}

export interface ClassifiedGap {
  study: Study;
  framework: "PICO" | "PECO" | "SPIDER" | "ECLIPSE";
  components: Record<string, string>;
}

export interface ResearchQuestion {
  text: string;
  framework: string;
  rationale: string;
}

export type DatabaseName =
  | "pubmed"
  | "semanticScholar"
  | "openAlex"
  | "europePmc"
  | "arxiv"
  | "eric"
  | "googleScholar"
  | "shodhganga"
  | "consensus";

export interface SearchResults {
  pubmed: Study[];
  semanticScholar: Study[];
  openAlex: Study[];
  europePmc: Study[];
  arxiv: Study[];
  eric: Study[];
  googleScholar: Study[];
  shodhganga: Study[];
  consensus: Study[];
}

export interface DatabaseStatus {
  pubmed: "idle" | "loading" | "success" | "error";
  semanticScholar: "idle" | "loading" | "success" | "error";
  openAlex: "idle" | "loading" | "success" | "error";
  europePmc: "idle" | "loading" | "success" | "error";
  arxiv: "idle" | "loading" | "success" | "error";
  eric: "idle" | "loading" | "success" | "error";
  googleScholar: "idle" | "loading" | "success" | "error";
  shodhganga: "idle" | "loading" | "success" | "error";
  consensus: "idle" | "loading" | "success" | "error";
}

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { Textarea } from "@/components/ui/textarea";
import {
  BarChart3,
  ChevronDown,
  ChevronRight,
  Download,
  FileText,
  Lightbulb,
  Loader2,
  Pencil,
  Search,
  Target,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useState } from "react";
import { toast } from "sonner";

import { DatabasePanel } from "./components/DatabasePanel";
import {
  GapClassification,
  classifyStudies,
} from "./components/GapClassification";
import { ResearchQuestionSuggestions } from "./components/ResearchQuestionSuggestions";
import {
  SynthesisTable,
  buildSynthesisRows,
} from "./components/SynthesisTable";

import {
  fetchArXiv,
  fetchERIC,
  fetchEuropePMC,
  fetchGoogleScholar,
  fetchOpenAlex,
  fetchPubMed,
  fetchSemanticScholar,
  fetchShodhganga,
} from "./lib/fetchDatabases";
import { generateResearchQuestions } from "./lib/searchUtils";

import type {
  ClassifiedGap,
  DatabaseStatus,
  ResearchQuestion,
  SearchResults,
  Study,
  SynthesisRow,
} from "./types/study";

const DB_META: {
  key: keyof SearchResults;
  name: string;
  accentClass: string;
  accentBg: string;
}[] = [
  {
    key: "pubmed",
    name: "PubMed",
    accentClass: "text-blue-700",
    accentBg: "bg-blue-500",
  },
  {
    key: "semanticScholar",
    name: "Semantic Scholar",
    accentClass: "text-teal-700",
    accentBg: "bg-teal-500",
  },
  {
    key: "openAlex",
    name: "OpenAlex",
    accentClass: "text-indigo-700",
    accentBg: "bg-indigo-500",
  },
  {
    key: "europePmc",
    name: "Europe PMC",
    accentClass: "text-green-700",
    accentBg: "bg-green-500",
  },
  {
    key: "arxiv",
    name: "ArXiv",
    accentClass: "text-red-700",
    accentBg: "bg-red-500",
  },
  {
    key: "eric",
    name: "ERIC",
    accentClass: "text-amber-700",
    accentBg: "bg-amber-500",
  },
  {
    key: "googleScholar",
    name: "Google Scholar (via CrossRef)",
    accentClass: "text-purple-700",
    accentBg: "bg-purple-500",
  },
  {
    key: "shodhganga",
    name: "Shodhganga / Indian Theses",
    accentClass: "text-orange-700",
    accentBg: "bg-orange-500",
  },
];

const EMPTY_RESULTS: SearchResults = {
  pubmed: [],
  semanticScholar: [],
  openAlex: [],
  europePmc: [],
  arxiv: [],
  eric: [],
  googleScholar: [],
  shodhganga: [],
};

const IDLE_STATUS: DatabaseStatus = {
  pubmed: "idle",
  semanticScholar: "idle",
  openAlex: "idle",
  europePmc: "idle",
  arxiv: "idle",
  eric: "idle",
  googleScholar: "idle",
  shodhganga: "idle",
};

type Section = "search" | "synthesis" | "gaps" | "questions" | "objectives";

export default function App() {
  const [broadArea, setBroadArea] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [results, setResults] = useState<SearchResults>(EMPTY_RESULTS);
  const [dbStatus, setDbStatus] = useState<DatabaseStatus>(IDLE_STATUS);
  const [dbErrors, setDbErrors] = useState<
    Partial<Record<keyof SearchResults, string>>
  >({});
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [openSection, setOpenSection] = useState<Section | null>("search");

  const [synthesisRows, setSynthesisRows] = useState<SynthesisRow[]>([]);
  const [classifiedGaps, setClassifiedGaps] = useState<ClassifiedGap[]>([]);
  const [researchQuestions, setResearchQuestions] = useState<
    ResearchQuestion[]
  >([]);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  // Year filter state
  const [yearFrom, setYearFrom] = useState("");
  const [yearTo, setYearTo] = useState("");
  const [yearFilterOpen, setYearFilterOpen] = useState(false);

  // Refine research question state
  const [selectedQuestion, setSelectedQuestion] = useState<string>("");
  const [refineOpen, setRefineOpen] = useState(false);
  const [refinedQuestion, setRefinedQuestion] = useState<string>("");
  const [editingObjective, setEditingObjective] = useState<{
    type: "primary" | number;
    value: string;
  } | null>(null);

  // Objectives state
  const [objectives, setObjectives] = useState<{
    primary: string;
    secondary: string[];
  } | null>(null);

  // ── Search ──────────────────────────────────────────────────────────────────────
  const handleSearch = useCallback(async () => {
    const query = broadArea.trim();
    if (!query) {
      toast.error("Please enter a broad area of research.");
      return;
    }
    setIsSearching(true);
    setHasSearched(true);
    setResults(EMPTY_RESULTS);
    setSelectedIds(new Set());
    setSynthesisRows([]);
    setClassifiedGaps([]);
    setResearchQuestions([]);
    setSelectedQuestion("");
    setRefinedQuestion("");
    setRefineOpen(false);
    setObjectives(null);
    setOpenSection("search");

    const yFrom = yearFrom || undefined;
    const yTo = yearTo || undefined;

    setDbStatus({
      pubmed: "loading",
      semanticScholar: "loading",
      openAlex: "loading",
      europePmc: "loading",
      arxiv: "loading",
      eric: "loading",
      googleScholar: "loading",
      shodhganga: "loading",
    });

    const fetchers: [keyof SearchResults, Promise<Study[]>][] = [
      ["pubmed", fetchPubMed(query, yFrom, yTo)],
      ["semanticScholar", fetchSemanticScholar(query, yFrom, yTo)],
      ["openAlex", fetchOpenAlex(query, yFrom, yTo)],
      ["europePmc", fetchEuropePMC(query, yFrom, yTo)],
      ["arxiv", fetchArXiv(query, yFrom, yTo)],
      ["eric", fetchERIC(query, yFrom, yTo)],
      ["googleScholar", fetchGoogleScholar(query, yFrom, yTo)],
      ["shodhganga", fetchShodhganga(query, yFrom, yTo)],
    ];

    for (const [key, promise] of fetchers) {
      promise
        .then((studies) => {
          setResults((prev) => ({ ...prev, [key]: studies }));
          setDbStatus((prev) => ({ ...prev, [key]: "success" }));
        })
        .catch((err) => {
          console.error(`${key} fetch failed:`, err);
          setDbErrors((prev) => ({
            ...prev,
            [key]: (err as Error)?.message || "Fetch failed",
          }));
          setDbStatus((prev) => ({ ...prev, [key]: "error" }));
        });
    }

    await Promise.allSettled(fetchers.map(([, p]) => p));
    setIsSearching(false);
  }, [broadArea, yearFrom, yearTo]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSearch();
    }
  };

  // Boolean operator insertion
  const appendOperator = (op: "AND" | "OR" | "NOT") => {
    setBroadArea((prev) => {
      const trimmed = prev.trimEnd();
      return trimmed ? `${trimmed} ${op} ` : `${op} `;
    });
  };

  // ── Selection ───────────────────────────────────────────────────────────────────
  const toggleStudy = (study: Study) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(study.id)) next.delete(study.id);
      else next.add(study.id);
      return next;
    });
  };

  const selectAllFromDb = (key: keyof SearchResults) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const s of results[key]) next.add(s.id);
      return next;
    });
  };

  const clearAllFromDb = (key: keyof SearchResults) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const s of results[key]) next.delete(s.id);
      return next;
    });
  };

  const totalSelected = selectedIds.size;

  // ── Generate Synthesis Table ──────────────────────────────────────────────────────
  const handleGenerateSynthesis = () => {
    const allStudies = Object.values(results).flat();
    const selected = allStudies.filter((s) => selectedIds.has(s.id));
    if (selected.length === 0) {
      toast.error("Please select at least one study.");
      return;
    }
    const rows = buildSynthesisRows(selected);
    setSynthesisRows(rows);
    setOpenSection("synthesis");
    toast.success(
      `Evidence synthesis table generated with ${rows.length} studies.`,
    );
  };

  // ── Classify Gaps ──────────────────────────────────────────────────────────────────
  const handleClassifyGaps = () => {
    const allStudies = Object.values(results).flat();
    const selected = allStudies.filter((s) => selectedIds.has(s.id));
    const gaps = classifyStudies(selected);
    setClassifiedGaps(gaps);
    setOpenSection("gaps");
    toast.success("Research gaps classified by framework.");
  };

  // ── Generate Research Questions ─────────────────────────────────────────────────────
  const handleGenerateQuestions = () => {
    if (classifiedGaps.length === 0) {
      toast.error("Please classify gaps first.");
      return;
    }
    const qs = generateResearchQuestions(broadArea, classifiedGaps);
    setResearchQuestions(qs);
    setOpenSection("questions");
    toast.success("Research questions generated!");
  };

  // ── Select & Refine Question ──────────────────────────────────────────────────────
  const handleSelectQuestion = (questionText: string) => {
    setSelectedQuestion(questionText);
    setRefinedQuestion(questionText);
    setRefineOpen(true);
    setObjectives(null);
    // Keep questions section open so the refine panel is visible
    setOpenSection("questions");
  };

  // ── Generate Objectives ─────────────────────────────────────────────────────────────
  const handleGenerateObjectives = () => {
    const q = refinedQuestion.trim() || selectedQuestion.trim();
    if (!q) {
      toast.error("Please select or write a research question first.");
      return;
    }

    // Determine dominant framework
    const counts: Record<string, number> = {};
    for (const g of classifiedGaps)
      counts[g.framework] = (counts[g.framework] || 0) + 1;
    const dominant =
      Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || "PICO";
    const area = broadArea.trim() || "the study population";

    // Generate primary objective
    const primary = `To ${
      q.toLowerCase().startsWith("what") || q.toLowerCase().startsWith("how")
        ? "explore and understand"
        : "evaluate"
    } ${area.toLowerCase()} by addressing the identified research gaps through a structured ${dominant}-based study.`;

    // Generate secondary objectives based on framework
    let secondary: string[] = [];
    if (dominant === "PICO") {
      secondary = [
        `To describe the baseline characteristics of the study population in relation to ${area}.`,
        "To assess the primary outcome of the intervention compared to standard care.",
        "To identify potential confounders and effect modifiers in the association between intervention and outcome.",
        `To evaluate the safety and adverse effects associated with the intervention in ${area}.`,
        "To recommend evidence-based clinical guidelines based on the study findings.",
      ];
    } else if (dominant === "PECO") {
      secondary = [
        "To describe the prevalence and distribution of the exposure in the study population.",
        `To quantify the association between the identified exposure and health outcomes in ${area}.`,
        "To identify subgroup differences in exposure-outcome associations across demographic variables.",
        "To assess potential confounding factors in the relationship between exposure and outcome.",
        `To inform public health policies based on findings from ${area}.`,
      ];
    } else if (dominant === "SPIDER") {
      secondary = [
        `To explore the lived experiences of individuals affected by ${area}.`,
        "To identify themes and patterns in participant perceptions of healthcare services.",
        `To assess barriers and facilitators to healthcare access in the context of ${area}.`,
        `To understand the impact of ${area} on quality of life from the participant's perspective.`,
        "To generate hypotheses for future quantitative research based on qualitative findings.",
      ];
    } else {
      secondary = [
        `To describe the current service delivery model for ${area} and identify gaps.`,
        `To evaluate patient and provider perspectives on care quality in ${area}.`,
        `To compare outcomes across different healthcare settings managing ${area}.`,
        `To identify organizational factors influencing service delivery for ${area}.`,
        `To recommend improvements to the healthcare delivery framework for ${area}.`,
      ];
    }

    setObjectives({ primary, secondary });
    setOpenSection("objectives");
    toast.success("Primary and secondary objectives generated!");
  };

  // ── Save inline edit ──────────────────────────────────────────────────────────────────
  const handleSaveEdit = () => {
    if (!editingObjective || !objectives) return;
    if (editingObjective.type === "primary") {
      setObjectives({ ...objectives, primary: editingObjective.value });
    } else {
      const updated = [...objectives.secondary];
      updated[editingObjective.type as number] = editingObjective.value;
      setObjectives({ ...objectives, secondary: updated });
    }
    setEditingObjective(null);
    toast.success("Objective updated.");
  };

  // ── PDF Export ──────────────────────────────────────────────────────────────────────
  const handleExportPDF = () => {
    setIsExportingPDF(true);
    try {
      const now = new Date().toLocaleDateString("en-GB");

      const synthesisTableHtml =
        synthesisRows.length > 0
          ? `<h2>Evidence Synthesis Table</h2>
             <table border="1" cellpadding="4" cellspacing="0" style="width:100%;border-collapse:collapse;font-size:11px">
               <thead style="background:#162c64;color:#fff">
                 <tr>
                   <th>#</th><th>Vancouver Reference</th><th>Key Findings</th>
                   <th>Research Gaps</th><th>Author-Stated Limitations</th><th>Future Research</th>
                 </tr>
               </thead>
               <tbody>
                 ${synthesisRows
                   .map(
                     (
                       r,
                       i,
                     ) => `<tr style="background:${i % 2 === 0 ? "#f5f8ff" : "#fff"}">
                   <td>${r.srlNo}</td>
                   <td>${r.vancouverRef}</td>
                   <td>${r.keyFindings || "—"}</td>
                   <td>${r.researchGaps || "—"}</td>
                   <td>${r.authorLimitations || "—"}</td>
                   <td>${r.futureResearch || "—"}</td>
                 </tr>`,
                   )
                   .join("")}
               </tbody>
             </table>`
          : "";

      const gapsTableHtml =
        classifiedGaps.length > 0
          ? `<h2>Gap Framework Classification</h2>
             <table border="1" cellpadding="4" cellspacing="0" style="width:100%;border-collapse:collapse;font-size:11px">
               <thead style="background:#162c64;color:#fff">
                 <tr><th>Study</th><th>Framework</th><th>Key Components</th><th>Identified Gap</th></tr>
               </thead>
               <tbody>
                 ${classifiedGaps
                   .map(
                     (
                       g,
                       i,
                     ) => `<tr style="background:${i % 2 === 0 ? "#f5f8ff" : "#fff"}">
                   <td>${g.study.title.slice(0, 80)} (${g.study.year})</td>
                   <td>${g.framework}</td>
                   <td>${Object.entries(g.components)
                     .map(([k, v]) => `${k}: ${v}`)
                     .join("; ")}</td>
                   <td>${g.study.researchGaps || "—"}</td>
                 </tr>`,
                   )
                   .join("")}
               </tbody>
             </table>`
          : "";

      const questionsTableHtml =
        researchQuestions.length > 0
          ? `<h2>Suggested Research Questions</h2>
             <table border="1" cellpadding="4" cellspacing="0" style="width:100%;border-collapse:collapse;font-size:11px">
               <thead style="background:#162c64;color:#fff">
                 <tr><th>#</th><th>Research Question</th><th>Framework</th><th>Rationale</th></tr>
               </thead>
               <tbody>
                 ${researchQuestions
                   .map(
                     (
                       q,
                       i,
                     ) => `<tr style="background:${i % 2 === 0 ? "#f5f8ff" : "#fff"}">
                   <td>${i + 1}</td><td>${q.text}</td><td>${q.framework}</td><td>${q.rationale}</td>
                 </tr>`,
                   )
                   .join("")}
               </tbody>
             </table>${
               refinedQuestion
                 ? `<p style="margin-top:12px"><strong>Refined Research Question:</strong> ${refinedQuestion}</p>`
                 : ""
             }`
          : "";

      const objectivesHtml = objectives
        ? `<h2>Aims &amp; Objectives</h2>
           <p><strong>Primary Objective:</strong> ${objectives.primary}</p>
           <ol>
             ${objectives.secondary
               .map(
                 (s, i) =>
                   `<li><strong>Secondary Objective ${i + 1}:</strong> ${s}</li>`,
               )
               .join("")}
           </ol>`
        : "";

      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/>
        <title>Evidence Synthesis Report</title>
        <style>
          body { font-family: Arial, sans-serif; font-size: 12px; margin: 20px; color: #111; }
          h1 { color: #162c64; font-size: 18px; }
          h2 { color: #162c64; font-size: 14px; margin-top: 24px; }
          table { page-break-inside: auto; }
          tr { page-break-inside: avoid; page-break-after: auto; }
          @media print { body { margin: 10mm; } }
        </style>
      </head><body>
        <h1>Evidence Synthesis Report</h1>
        <p><strong>Broad Area:</strong> ${broadArea}</p>
        <p><strong>Date Generated:</strong> ${now}</p>
        <p><strong>Databases Searched:</strong> PubMed, Semantic Scholar, OpenAlex, Europe PMC, ArXiv, ERIC, Google Scholar (via CrossRef), Shodhganga</p>
        ${synthesisTableHtml}
        ${gapsTableHtml}
        ${questionsTableHtml}
        ${objectivesHtml}
      </body></html>`;

      const printWin = window.open("", "_blank", "width=1000,height=700");
      if (!printWin) {
        toast.error("Popup blocked. Please allow popups for this site.");
        return;
      }
      printWin.document.write(html);
      printWin.document.close();
      printWin.focus();
      setTimeout(() => {
        printWin.print();
      }, 500);
      toast.success("Print dialog opened — save as PDF from your browser.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to export. Please try again.");
    } finally {
      setIsExportingPDF(false);
    }
  };

  // ── Section toggle ──────────────────────────────────────────────────────────────────
  const toggleSection = (s: Section) =>
    setOpenSection((prev) => (prev === s ? null : s));

  const totalResults = Object.values(results).flat().length;
  const currentYear = new Date().getFullYear();

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "#e8f5e9", color: "#111111" }}
    >
      <Toaster richColors position="top-right" />

      {/* Header */}
      <header
        className="sticky top-0 z-40 backdrop-blur border-b border-green-200 shadow-sm"
        style={{ backgroundColor: "#c8e6c9" }}
      >
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-navy flex items-center justify-center flex-shrink-0">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1
              className="text-base font-bold leading-tight"
              style={{ color: "#111111" }}
            >
              Health Research Navigator
            </h1>
            <p className="text-xs leading-tight" style={{ color: "#444444" }}>
              Evidence-Based Research Question Builder
            </p>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-10 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <Badge
            variant="outline"
            className="mb-3 text-xs font-semibold tracking-widest uppercase px-3 border-green-400"
            style={{ color: "#1b5e20" }}
          >
            Multi-Database Evidence Synthesis
          </Badge>
          <h2
            className="font-serif text-3xl md:text-4xl mb-2"
            style={{ color: "#111111" }}
          >
            From Broad Topic to Research Question
          </h2>
          <p className="text-sm max-w-lg mx-auto" style={{ color: "#333333" }}>
            Search PubMed, Semantic Scholar, OpenAlex, Europe PMC, ArXiv, ERIC,
            Google Scholar, and Shodhganga simultaneously. Build an evidence
            synthesis table, classify research gaps, and generate structured
            research questions.
          </p>
        </div>
      </section>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 md:px-6 pb-20 space-y-6">
        {/* Step 1: Broad Area + Search */}
        <div
          className="rounded-2xl border border-green-300 shadow-card overflow-hidden"
          style={{ backgroundColor: "#ffffff" }}
        >
          <div className="bg-navy px-6 py-4">
            <h3 className="text-white font-semibold text-lg font-serif">
              Broad Area of Research
            </h3>
            <p className="text-white/60 text-xs mt-0.5">
              Enter your topic and search all 8 databases simultaneously
            </p>
          </div>

          <div className="p-5">
            {/* Main query input */}
            <Textarea
              value={broadArea}
              onChange={(e) => setBroadArea(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g. antibiotic resistance in children, diabetes mellitus management..."
              rows={3}
              className="w-full text-sm rounded-xl border-green-300 focus:ring-green-400/40"
              style={{ backgroundColor: "#f1f8e9", color: "#111111" }}
              data-ocid="search.textarea"
            />

            {/* Boolean operators */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span
                className="text-xs font-medium"
                style={{ color: "#555555" }}
              >
                Boolean operators:
              </span>
              {(["AND", "OR", "NOT"] as const).map((op) => (
                <button
                  key={op}
                  type="button"
                  onClick={() => appendOperator(op)}
                  className={`px-3 py-1 text-xs font-bold rounded-full border transition-colors ${
                    op === "AND"
                      ? "bg-green-100 border-green-400 text-green-800 hover:bg-green-200"
                      : op === "OR"
                        ? "bg-blue-100 border-blue-400 text-blue-800 hover:bg-blue-200"
                        : "bg-orange-100 border-orange-400 text-orange-800 hover:bg-orange-200"
                  }`}
                  data-ocid="search.toggle"
                >
                  {op}
                </button>
              ))}
              <p className="text-xs ml-auto" style={{ color: "#888888" }}>
                Example:{" "}
                <code
                  className="px-1.5 py-0.5 rounded"
                  style={{
                    backgroundColor: "#f1f8e9",
                    color: "#374151",
                    fontFamily: "monospace",
                  }}
                >
                  diabetes AND insulin NOT type1
                </code>
              </p>
            </div>

            {/* Year filter toggle */}
            <div
              className="mt-3 border border-green-200 rounded-xl overflow-hidden"
              style={{ backgroundColor: "#f1f8e9" }}
            >
              <button
                type="button"
                onClick={() => setYearFilterOpen((v) => !v)}
                className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium hover:bg-green-100 transition-colors"
                style={{ color: "#1b5e20" }}
                data-ocid="search.toggle"
              >
                <span>
                  Filter by Year of Publication{" "}
                  {yearFrom || yearTo
                    ? `(${yearFrom || "…"} – ${yearTo || "…"})`
                    : ""}
                </span>
                {yearFilterOpen ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
              {yearFilterOpen && (
                <div className="px-4 pb-3 flex items-center gap-3">
                  <div className="flex flex-col gap-1">
                    <label
                      htmlFor="year-from"
                      className="text-xs font-medium"
                      style={{ color: "#333333" }}
                    >
                      From Year
                    </label>
                    <input
                      id="year-from"
                      type="number"
                      min="1900"
                      max={currentYear}
                      placeholder="e.g. 2015"
                      value={yearFrom}
                      onChange={(e) => setYearFrom(e.target.value)}
                      className="w-28 px-2 py-1.5 text-sm rounded-lg border border-green-300 bg-white focus:outline-none focus:ring-2 focus:ring-green-400/40"
                      style={{ color: "#111111" }}
                      data-ocid="search.input"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label
                      htmlFor="year-to"
                      className="text-xs font-medium"
                      style={{ color: "#333333" }}
                    >
                      To Year
                    </label>
                    <input
                      id="year-to"
                      type="number"
                      min="1900"
                      max={currentYear}
                      placeholder={`e.g. ${currentYear}`}
                      value={yearTo}
                      onChange={(e) => setYearTo(e.target.value)}
                      className="w-28 px-2 py-1.5 text-sm rounded-lg border border-green-300 bg-white focus:outline-none focus:ring-2 focus:ring-green-400/40"
                      style={{ color: "#111111" }}
                      data-ocid="search.input"
                    />
                  </div>
                  {(yearFrom || yearTo) && (
                    <button
                      type="button"
                      onClick={() => {
                        setYearFrom("");
                        setYearTo("");
                      }}
                      className="mt-4 text-xs underline"
                      style={{ color: "#888888" }}
                      data-ocid="search.cancel_button"
                    >
                      Clear
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button
                onClick={handleSearch}
                disabled={isSearching || !broadArea.trim()}
                size="lg"
                className="gap-2 px-6 bg-navy hover:bg-navy/90 text-white"
                data-ocid="search.primary_button"
              >
                {isSearching ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Searching All
                    Databases…
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" /> Search All Databases
                  </>
                )}
              </Button>
              {hasSearched && (
                <span className="text-xs" style={{ color: "#444444" }}>
                  {totalResults} total results
                </span>
              )}
            </div>

            {/* Database status indicators */}
            <div className="mt-5 flex flex-wrap gap-2">
              {DB_META.map((db) => (
                <div
                  key={db.key}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs"
                  style={{
                    backgroundColor: "#f1f8e9",
                    borderColor: "#a5d6a7",
                    color: "#333333",
                  }}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      dbStatus[db.key] === "loading"
                        ? "bg-yellow-400 animate-pulse"
                        : dbStatus[db.key] === "success"
                          ? db.accentBg
                          : dbStatus[db.key] === "error"
                            ? "bg-red-400"
                            : "bg-gray-300"
                    }`}
                  />
                  <span className="font-medium" style={{ color: "#333333" }}>
                    {db.name}
                  </span>
                  {dbStatus[db.key] === "success" && (
                    <span className="font-bold" style={{ color: "#111111" }}>
                      {results[db.key].length}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Step 2: Search Results */}
        <AnimatePresence>
          {hasSearched && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-green-300 shadow-card overflow-hidden"
              style={{ backgroundColor: "#ffffff" }}
            >
              <SectionHeader
                title="Search Results"
                subtitle={`${totalResults} results across 8 databases · ${totalSelected} selected`}
                icon={<Search className="w-4 h-4" />}
                isOpen={openSection === "search"}
                onToggle={() => toggleSection("search")}
                ocid="results.panel"
              />

              {openSection === "search" && (
                <div className="p-5">
                  {/* Global selection bar */}
                  {totalSelected > 0 && (
                    <div
                      className="mb-4 p-3 rounded-xl border border-green-300 flex items-center justify-between"
                      style={{ backgroundColor: "#e8f5e9" }}
                    >
                      <span
                        className="text-sm font-medium"
                        style={{ color: "#1b5e20" }}
                      >
                        {totalSelected} studies selected for synthesis
                      </span>
                      <Button
                        size="sm"
                        onClick={() => setSelectedIds(new Set())}
                        variant="ghost"
                        className="text-xs"
                        data-ocid="results.toggle"
                      >
                        Clear All Selections
                      </Button>
                    </div>
                  )}

                  {/* Database panels */}
                  {DB_META.map((db) => (
                    <DatabasePanel
                      key={db.key}
                      name={db.name}
                      dbKey={db.key}
                      studies={results[db.key]}
                      status={dbStatus[db.key]}
                      errorMsg={dbErrors[db.key]}
                      selectedIds={selectedIds}
                      onToggleSelect={toggleStudy}
                      onSelectAll={() => selectAllFromDb(db.key)}
                      onClearAll={() => clearAllFromDb(db.key)}
                      accentClass={db.accentClass}
                      accentBg={db.accentBg}
                    />
                  ))}

                  {/* CrossRef sourcing note */}
                  <p className="text-xs mt-2" style={{ color: "#666666" }}>
                    * Google Scholar results are sourced via CrossRef, which
                    indexes the same academic literature. Shodhganga results
                    show dissertations indexed in CrossRef.
                  </p>

                  {/* Generate synthesis button */}
                  {totalSelected > 0 && (
                    <div className="mt-4 pt-4 border-t border-green-200 flex flex-wrap gap-3">
                      <Button
                        onClick={handleGenerateSynthesis}
                        className="gap-2 bg-navy hover:bg-navy/90 text-white"
                        data-ocid="synthesis.open_modal_button"
                      >
                        <FileText className="w-4 h-4" />
                        Generate Evidence Synthesis Table ({totalSelected})
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step 3: Evidence Synthesis Table */}
        <AnimatePresence>
          {synthesisRows.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-green-300 shadow-card overflow-hidden"
              style={{ backgroundColor: "#ffffff" }}
            >
              <SectionHeader
                title="Evidence Synthesis Table"
                subtitle={`${synthesisRows.length} studies · Vancouver references · Key findings & gaps`}
                icon={<FileText className="w-4 h-4" />}
                isOpen={openSection === "synthesis"}
                onToggle={() => toggleSection("synthesis")}
                ocid="synthesis.panel"
              />

              {openSection === "synthesis" && (
                <div className="p-5">
                  <SynthesisTable
                    rows={synthesisRows}
                    onExportPDF={handleExportPDF}
                    isExporting={isExportingPDF}
                  />

                  <div className="mt-5 pt-4 border-t border-green-200">
                    <Button
                      onClick={handleClassifyGaps}
                      className="gap-2 bg-navy hover:bg-navy/90 text-white"
                      data-ocid="gaps.open_modal_button"
                    >
                      <BarChart3 className="w-4 h-4" />
                      Classify Research Gaps into Frameworks
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step 4: Gap Framework Classification */}
        <AnimatePresence>
          {classifiedGaps.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-green-300 shadow-card overflow-hidden"
              style={{ backgroundColor: "#ffffff" }}
            >
              <SectionHeader
                title="Gap Framework Classification"
                subtitle="PICO / PECO / SPIDER / ECLIPSE — auto-detected from abstracts"
                icon={<BarChart3 className="w-4 h-4" />}
                isOpen={openSection === "gaps"}
                onToggle={() => toggleSection("gaps")}
                ocid="gaps.panel"
              />

              {openSection === "gaps" && (
                <div className="p-5">
                  <GapClassification
                    classifiedGaps={classifiedGaps}
                    onClassified={setClassifiedGaps}
                  />

                  <div className="mt-5 pt-4 border-t border-green-200">
                    <Button
                      onClick={handleGenerateQuestions}
                      className="gap-2 bg-navy hover:bg-navy/90 text-white"
                      data-ocid="questions.open_modal_button"
                    >
                      <Lightbulb className="w-4 h-4" />
                      Suggest Research Questions
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step 5: Research Questions + Refine panel */}
        <AnimatePresence>
          {researchQuestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-green-300 shadow-card overflow-hidden"
              style={{ backgroundColor: "#ffffff" }}
            >
              <SectionHeader
                title="Suggested Research Questions"
                subtitle="Template-based generation from identified gaps and frameworks"
                icon={<Lightbulb className="w-4 h-4" />}
                isOpen={openSection === "questions"}
                onToggle={() => toggleSection("questions")}
                ocid="questions.panel"
              />

              {openSection === "questions" && (
                <div className="p-5">
                  <ResearchQuestionSuggestions
                    questions={researchQuestions}
                    classifiedGaps={classifiedGaps}
                    broadArea={broadArea}
                    onSelectQuestion={handleSelectQuestion}
                  />

                  {/* ─── Refine Research Question panel ────────────────────── */}
                  <div className="mt-6">
                    <button
                      type="button"
                      onClick={() => setRefineOpen((v) => !v)}
                      className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl border-2 transition-colors"
                      style={{
                        backgroundColor: refineOpen ? "#fffde7" : "#f9fafb",
                        borderColor: refineOpen ? "#f9a825" : "#d1d5db",
                        color: "#111111",
                      }}
                      data-ocid="questions.toggle"
                    >
                      <Pencil
                        className="w-4 h-4"
                        style={{ color: "#f9a825" }}
                      />
                      Refine Research Question
                      {refineOpen ? (
                        <ChevronDown className="w-4 h-4 ml-auto" />
                      ) : (
                        <ChevronRight className="w-4 h-4 ml-auto" />
                      )}
                    </button>

                    <AnimatePresence>
                      {refineOpen && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div
                            className="mt-3 p-5 rounded-xl border-2"
                            style={{
                              backgroundColor: "#fffde7",
                              borderColor: "#f9a825",
                            }}
                          >
                            <p
                              className="text-xs font-medium mb-3"
                              style={{ color: "#7b5800" }}
                            >
                              Edit the research question below. Use the
                              recommendation chips to refine it, then generate
                              your primary and secondary objectives.
                            </p>

                            <Textarea
                              value={refinedQuestion}
                              onChange={(e) =>
                                setRefinedQuestion(e.target.value)
                              }
                              rows={4}
                              className="w-full text-sm rounded-xl border-amber-300 focus:ring-amber-400/40 mb-4"
                              style={{
                                backgroundColor: "#ffffff",
                                color: "#111111",
                              }}
                              placeholder="Your refined research question..."
                              data-ocid="questions.textarea"
                            />

                            {/* Recommendation chips */}
                            <div className="flex flex-wrap gap-2 mb-4">
                              <span
                                className="text-xs font-medium self-center"
                                style={{ color: "#7b5800" }}
                              >
                                Quick refine:
                              </span>
                              {(
                                [
                                  {
                                    label: "Make it more specific",
                                    append:
                                      " focusing specifically on [specify population/intervention]",
                                  },
                                  {
                                    label: "Add timeframe",
                                    append:
                                      " within a [specify timeframe] period",
                                  },
                                  {
                                    label: "Add location context",
                                    append:
                                      " in [specify geographic or clinical setting]",
                                  },
                                  {
                                    label: "Add comparison",
                                    append: " compared to [specify comparator]",
                                  },
                                ] as const
                              ).map((chip) => (
                                <button
                                  key={chip.label}
                                  type="button"
                                  onClick={() =>
                                    setRefinedQuestion(
                                      (prev) => prev + chip.append,
                                    )
                                  }
                                  className="px-3 py-1 text-xs rounded-full border font-medium transition-colors hover:bg-amber-100"
                                  style={{
                                    backgroundColor: "#fff8e1",
                                    borderColor: "#f9a825",
                                    color: "#7b5800",
                                  }}
                                  data-ocid="questions.toggle"
                                >
                                  + {chip.label}
                                </button>
                              ))}
                            </div>

                            <Button
                              onClick={handleGenerateObjectives}
                              className="gap-2 bg-navy hover:bg-navy/90 text-white"
                              data-ocid="objectives.open_modal_button"
                            >
                              <Target className="w-4 h-4" />
                              Generate Objectives from this Question →
                            </Button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="mt-5 pt-4 border-t border-green-200">
                    <Button
                      onClick={handleExportPDF}
                      disabled={isExportingPDF}
                      variant="outline"
                      className="gap-2 border-green-400"
                      data-ocid="export.primary_button"
                    >
                      {isExportingPDF ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />{" "}
                          Generating…
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4" /> Export Full Synthesis
                          Report (PDF)
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step 6: Aims & Objectives */}
        <AnimatePresence>
          {objectives !== null && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-green-300 shadow-card overflow-hidden"
              style={{ backgroundColor: "#ffffff" }}
            >
              <SectionHeader
                title="Aims & Objectives"
                subtitle="Auto-generated from your research question"
                icon={<Target className="w-4 h-4" />}
                isOpen={openSection === "objectives"}
                onToggle={() => toggleSection("objectives")}
                ocid="objectives.panel"
              />

              {openSection === "objectives" && (
                <div className="p-5">
                  {/* Refined question display */}
                  {refinedQuestion && (
                    <div
                      className="mb-5 p-4 rounded-xl border border-amber-300"
                      style={{ backgroundColor: "#fffde7" }}
                    >
                      <p
                        className="text-xs font-semibold mb-1"
                        style={{ color: "#7b5800" }}
                      >
                        Research Question
                      </p>
                      <p
                        className="text-sm font-medium leading-snug"
                        style={{ color: "#111111" }}
                      >
                        {refinedQuestion}
                      </p>
                    </div>
                  )}

                  {/* Primary Objective */}
                  <div className="mb-5">
                    <div className="flex items-center justify-between mb-2">
                      <p
                        className="text-sm font-bold"
                        style={{ color: "#111111" }}
                      >
                        Primary Objective
                      </p>
                      <button
                        type="button"
                        onClick={() =>
                          setEditingObjective({
                            type: "primary",
                            value: objectives.primary,
                          })
                        }
                        className="text-xs flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-green-50 transition-colors"
                        style={{ color: "#2e7d32" }}
                        data-ocid="objectives.edit_button"
                      >
                        <Pencil className="w-3 h-3" /> Edit
                      </button>
                    </div>

                    {editingObjective?.type === "primary" ? (
                      <div className="space-y-2">
                        <Textarea
                          value={editingObjective.value}
                          onChange={(e) =>
                            setEditingObjective({
                              type: "primary",
                              value: e.target.value,
                            })
                          }
                          rows={3}
                          className="text-sm rounded-xl border-green-300"
                          style={{
                            backgroundColor: "#f1f8e9",
                            color: "#111111",
                          }}
                          data-ocid="objectives.textarea"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={handleSaveEdit}
                            className="bg-green-700 hover:bg-green-800 text-white"
                            data-ocid="objectives.save_button"
                          >
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingObjective(null)}
                            data-ocid="objectives.cancel_button"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div
                        className="border-l-4 border-green-600 bg-green-50 p-4 rounded-r-xl"
                        data-ocid="objectives.card"
                      >
                        <p className="text-sm" style={{ color: "#111111" }}>
                          {objectives.primary}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Secondary Objectives */}
                  <div>
                    <p
                      className="text-sm font-bold mb-3"
                      style={{ color: "#111111" }}
                    >
                      Secondary Objectives
                    </p>
                    <div className="space-y-2">
                      {objectives.secondary.map((obj, i) => (
                        <div
                          key={obj.slice(0, 30)}
                          className="bg-white border border-green-200 rounded-lg p-3"
                          data-ocid={`objectives.item.${i + 1}`}
                        >
                          {editingObjective?.type === i ? (
                            <div className="space-y-2">
                              <Textarea
                                value={editingObjective.value}
                                onChange={(e) =>
                                  setEditingObjective({
                                    type: i,
                                    value: e.target.value,
                                  })
                                }
                                rows={2}
                                className="text-sm rounded-xl border-green-300"
                                style={{
                                  backgroundColor: "#f1f8e9",
                                  color: "#111111",
                                }}
                                data-ocid="objectives.textarea"
                              />
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={handleSaveEdit}
                                  className="bg-green-700 hover:bg-green-800 text-white"
                                  data-ocid="objectives.save_button"
                                >
                                  Save
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setEditingObjective(null)}
                                  data-ocid="objectives.cancel_button"
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-start gap-3">
                              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-600 text-white text-xs flex items-center justify-center font-bold mt-0.5">
                                {i + 1}
                              </span>
                              <p
                                className="flex-1 text-sm leading-relaxed"
                                style={{ color: "#111111" }}
                              >
                                {obj}
                              </p>
                              <button
                                type="button"
                                onClick={() =>
                                  setEditingObjective({
                                    type: i,
                                    value: obj,
                                  })
                                }
                                className="flex-shrink-0 text-xs flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-green-50 transition-colors"
                                style={{ color: "#2e7d32" }}
                                data-ocid="objectives.edit_button"
                              >
                                <Pencil className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Export button */}
                  <div className="mt-6 pt-4 border-t border-green-200">
                    <Button
                      onClick={handleExportPDF}
                      disabled={isExportingPDF}
                      className="gap-2 bg-navy hover:bg-navy/90 text-white"
                      data-ocid="objectives.primary_button"
                    >
                      {isExportingPDF ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />{" "}
                          Generating…
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4" /> Include in PDF Export
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer
        className="border-t border-green-200 px-6 py-4 text-center"
        style={{ backgroundColor: "#c8e6c9" }}
      >
        <p className="text-xs" style={{ color: "#444444" }}>
          © {new Date().getFullYear()}. Built with ❤️ using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
            style={{ color: "#1b5e20" }}
          >
            caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}

function SectionHeader({
  title,
  subtitle,
  icon,
  isOpen,
  onToggle,
  ocid,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  ocid: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center justify-between px-6 py-4 border-b border-border bg-navy/95 text-white hover:bg-navy transition-colors"
      data-ocid={ocid}
    >
      <div className="flex items-center gap-3">
        <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center">
          {icon}
        </div>
        <div className="text-left">
          <p className="font-semibold text-sm">{title}</p>
          <p className="text-white/60 text-xs">{subtitle}</p>
        </div>
      </div>
      {isOpen ? (
        <ChevronDown className="w-4 h-4 text-white/70" />
      ) : (
        <ChevronRight className="w-4 h-4 text-white/70" />
      )}
    </button>
  );
}

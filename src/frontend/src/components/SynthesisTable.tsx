import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, Download } from "lucide-react";
import { useState } from "react";
import {
  extractAuthorLimitations,
  extractFutureResearch,
  formatVancouver,
} from "../lib/searchUtils";
import type { Study, SynthesisRow } from "../types/study";

interface SynthesisTableProps {
  rows: SynthesisRow[];
  onExportPDF: () => void;
  isExporting: boolean;
}

type SortKey = "srlNo" | "year";

export function SynthesisTable({
  rows,
  onExportPDF,
  isExporting,
}: SynthesisTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("srlNo");
  const [sortAsc, setSortAsc] = useState(true);

  const sorted = [...rows].sort((a, b) => {
    let cmp = 0;
    if (sortKey === "srlNo") cmp = a.srlNo - b.srlNo;
    else if (sortKey === "year")
      cmp = (a.study.year || 0) - (b.study.year || 0);
    return sortAsc ? cmp : -cmp;
  });

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc((v) => !v);
    else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  const sourceLabel = (src: string) => {
    const map: Record<string, string> = {
      PubMed: "bg-blue-100 text-blue-800",
      "Semantic Scholar": "bg-teal-100 text-teal-800",
      OpenAlex: "bg-indigo-100 text-indigo-800",
      "Europe PMC": "bg-green-100 text-green-800",
      ArXiv: "bg-red-100 text-red-800",
      ERIC: "bg-amber-100 text-amber-800",
    };
    return map[src] || "bg-gray-100 text-gray-800";
  };

  return (
    <div data-ocid="synthesis.table">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-foreground">
            Evidence Synthesis Table
          </h3>
          <Badge variant="secondary">{rows.length} studies</Badge>
        </div>
        <Button
          onClick={onExportPDF}
          disabled={isExporting}
          size="sm"
          className="gap-2"
          data-ocid="synthesis.primary_button"
        >
          <Download className="w-4 h-4" />
          {isExporting ? "Generating PDF…" : "Export PDF"}
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border shadow-card">
        <table className="w-full min-w-[1200px] text-sm">
          <thead>
            <tr className="bg-navy/90 text-white">
              <th className="px-4 py-3 text-left font-semibold w-10">
                <button
                  type="button"
                  onClick={() => handleSort("srlNo")}
                  className="flex items-center gap-1 hover:text-white/80"
                  data-ocid="synthesis.toggle"
                >
                  #{sortKey === "srlNo" && <ArrowUpDown className="w-3 h-3" />}
                </button>
              </th>
              <th className="px-4 py-3 text-left font-semibold min-w-[240px]">
                <button
                  type="button"
                  onClick={() => handleSort("year")}
                  className="flex items-center gap-1 hover:text-white/80"
                  data-ocid="synthesis.secondary_button"
                >
                  Vancouver Reference
                  {sortKey === "year" && <ArrowUpDown className="w-3 h-3" />}
                </button>
              </th>
              <th className="px-4 py-3 text-left font-semibold min-w-[180px]">
                Key Findings
              </th>
              <th className="px-4 py-3 text-left font-semibold min-w-[340px]">
                Research Gaps / Limitations
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sorted.map((row, idx) => (
              <tr
                key={row.srlNo}
                className={idx % 2 === 0 ? "bg-white" : "bg-muted/20"}
                data-ocid={`synthesis.row.${idx + 1}`}
              >
                <td className="px-4 py-3 text-center align-top">
                  <span className="text-xs font-bold text-muted-foreground">
                    {row.srlNo}
                  </span>
                </td>
                <td className="px-4 py-3 align-top">
                  <p className="text-xs leading-relaxed text-foreground/90">
                    {row.vancouverRef}
                  </p>
                  <span
                    className={`inline-block mt-1.5 text-xs px-1.5 py-0.5 rounded font-medium ${sourceLabel(row.study.source)}`}
                  >
                    {row.study.source}
                  </span>
                </td>
                <td className="px-4 py-3 align-top">
                  <p className="text-xs leading-relaxed text-foreground/80">
                    {row.keyFindings || (
                      <span className="italic text-muted-foreground">
                        Not extractable
                      </span>
                    )}
                  </p>
                </td>
                <td className="px-4 py-3 align-top space-y-3">
                  {/* Sub-section 1: General Research Gaps */}
                  {row.researchGaps && (
                    <div>
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-indigo-700 mb-0.5">
                        Research Gaps
                      </span>
                      <p className="text-xs leading-relaxed text-foreground/80">
                        {row.researchGaps}
                      </p>
                    </div>
                  )}

                  {/* Sub-section 2: Author-stated limitations of their own study */}
                  {row.authorLimitations ? (
                    <div>
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-orange-700 mb-0.5">
                        Author-Stated Limitations
                      </span>
                      <p className="text-xs leading-relaxed text-foreground/80">
                        {row.authorLimitations}
                      </p>
                    </div>
                  ) : null}

                  {/* Sub-section 3: Future research advice from the authors */}
                  {row.futureResearch ? (
                    <div>
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-700 mb-0.5">
                        Future Research Recommended
                      </span>
                      <p className="text-xs leading-relaxed text-foreground/80">
                        {row.futureResearch}
                      </p>
                    </div>
                  ) : null}

                  {/* Fallback if nothing was extracted */}
                  {!row.researchGaps &&
                    !row.authorLimitations &&
                    !row.futureResearch && (
                      <span className="italic text-xs text-muted-foreground">
                        Not mentioned in abstract
                      </span>
                    )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function buildSynthesisRows(studies: Study[]): SynthesisRow[] {
  return studies.map((study, idx) => ({
    srlNo: idx + 1,
    vancouverRef: formatVancouver(study),
    keyFindings: study.keyFindings || "",
    researchGaps: study.researchGaps || "",
    futureResearch:
      study.futureResearch || extractFutureResearch(study.abstract),
    authorLimitations:
      study.authorLimitations || extractAuthorLimitations(study.abstract),
    study,
  }));
}

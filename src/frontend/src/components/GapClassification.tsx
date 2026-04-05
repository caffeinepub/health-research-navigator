import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { getFrameworkComponents } from "../lib/searchUtils";
import { detectFramework } from "../lib/searchUtils";
import type { ClassifiedGap } from "../types/study";
import type { Study } from "../types/study";

const FRAMEWORK_COLORS: Record<
  string,
  { badge: string; dot: string; label: string }
> = {
  PICO: {
    badge: "bg-blue-100 text-blue-800 border-blue-200",
    dot: "bg-blue-500",
    label: "Patient / Intervention / Comparison / Outcome",
  },
  PECO: {
    badge: "bg-green-100 text-green-800 border-green-200",
    dot: "bg-green-500",
    label: "Population / Exposure / Comparator / Outcome",
  },
  SPIDER: {
    badge: "bg-purple-100 text-purple-800 border-purple-200",
    dot: "bg-purple-500",
    label: "Sample / Phenomenon / Design / Evaluation / Research",
  },
  ECLIPSE: {
    badge: "bg-orange-100 text-orange-800 border-orange-200",
    dot: "bg-orange-500",
    label: "Expectation / Client / Location / Impact / Professionals / SErvice",
  },
};

interface GapClassificationProps {
  classifiedGaps: ClassifiedGap[];
  onClassified: (gaps: ClassifiedGap[]) => void;
}

export function GapClassification({
  classifiedGaps,
  onClassified,
}: GapClassificationProps) {
  const [overrides, setOverrides] = useState<
    Record<string, "PICO" | "PECO" | "SPIDER" | "ECLIPSE">
  >({});

  const displayed: ClassifiedGap[] = classifiedGaps.map((g) => ({
    ...g,
    framework: overrides[g.study.id] || g.framework,
    components: getFrameworkComponents(
      g.study,
      overrides[g.study.id] || g.framework,
    ),
  }));

  const handleOverride = (
    studyId: string,
    fw: "PICO" | "PECO" | "SPIDER" | "ECLIPSE",
  ) => {
    const newOverrides = { ...overrides, [studyId]: fw };
    setOverrides(newOverrides);
    const updated = classifiedGaps.map((g) => ({
      ...g,
      framework: newOverrides[g.study.id] || g.framework,
      components: getFrameworkComponents(
        g.study,
        newOverrides[g.study.id] || g.framework,
      ),
    }));
    onClassified(updated);
  };

  // Framework summary
  const summary: Record<string, number> = {};
  for (const g of displayed) {
    summary[g.framework] = (summary[g.framework] || 0) + 1;
  }

  return (
    <div data-ocid="gaps.panel">
      {/* Summary */}
      <div className="flex flex-wrap gap-3 mb-5 p-4 bg-muted/20 rounded-xl border border-border">
        <span className="text-sm font-medium text-muted-foreground mr-1">
          Framework distribution:
        </span>
        {Object.entries(summary).map(([fw, count]) => {
          const colors = FRAMEWORK_COLORS[fw];
          return (
            <div
              key={fw}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold ${colors?.badge}`}
            >
              <span className={`w-2 h-2 rounded-full ${colors?.dot}`} />
              {fw}: {count}
            </div>
          );
        })}
      </div>

      {/* Per-study cards */}
      <div className="space-y-3">
        {displayed.map((gap, idx) => {
          const colors = FRAMEWORK_COLORS[gap.framework];
          const authorDisplay =
            gap.study.authors.length === 0
              ? "Unknown"
              : gap.study.authors.length <= 2
                ? gap.study.authors.join(", ")
                : `${gap.study.authors[0]} et al.`;
          return (
            <div
              key={gap.study.id}
              className="border border-border rounded-xl p-4 bg-white hover:shadow-card transition-shadow"
              data-ocid={`gaps.item.${idx + 1}`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground line-clamp-2">
                    {gap.study.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {authorDisplay}
                    {gap.study.year ? ` · ${gap.study.year}` : ""} ·{" "}
                    {gap.study.source}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge
                    className={`${colors?.badge} border text-xs font-bold px-2.5`}
                  >
                    {gap.framework}
                  </Badge>
                  <Select
                    value={overrides[gap.study.id] || gap.framework}
                    onValueChange={(val) =>
                      handleOverride(
                        gap.study.id,
                        val as "PICO" | "PECO" | "SPIDER" | "ECLIPSE",
                      )
                    }
                  >
                    <SelectTrigger
                      className="h-7 w-28 text-xs"
                      data-ocid={`gaps.select.${idx + 1}`}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PICO">PICO</SelectItem>
                      <SelectItem value="PECO">PECO</SelectItem>
                      <SelectItem value="SPIDER">SPIDER</SelectItem>
                      <SelectItem value="ECLIPSE">ECLIPSE</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Framework label */}
              <p className="text-xs text-muted-foreground mb-2 italic">
                {colors?.label}
              </p>

              {/* Components grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {Object.entries(gap.components).map(([key, val]) => (
                  <div key={key} className="bg-muted/30 rounded-lg px-3 py-2">
                    <span
                      className={`text-xs font-bold uppercase tracking-wide ${
                        colors?.badge.split(" ")[1]
                      }`}
                    >
                      {key}
                    </span>
                    <p className="text-xs text-foreground/80 mt-0.5 leading-snug line-clamp-2">
                      {val}
                    </p>
                  </div>
                ))}
              </div>

              {/* Gap text */}
              {gap.study.researchGaps &&
                gap.study.researchGaps !==
                  "No explicit limitations mentioned." && (
                  <div className="mt-3 p-2.5 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-xs font-semibold text-amber-800 mb-0.5">
                      Identified Gap/Limitation
                    </p>
                    <p className="text-xs text-amber-900/80 leading-relaxed">
                      {gap.study.researchGaps}
                    </p>
                  </div>
                )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function classifyStudies(studies: Study[]): ClassifiedGap[] {
  return studies.map((study) => {
    const fw = detectFramework(study.abstract, study.researchGaps || "");
    return {
      study,
      framework: fw,
      components: getFrameworkComponents(study, fw),
    };
  });
}

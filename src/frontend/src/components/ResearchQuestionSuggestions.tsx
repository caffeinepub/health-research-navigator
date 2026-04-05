import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, ChevronRight, Copy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { ClassifiedGap, ResearchQuestion } from "../types/study";

const FRAMEWORK_COLORS: Record<string, string> = {
  PICO: "bg-blue-100 text-blue-800 border-blue-200",
  PECO: "bg-green-100 text-green-800 border-green-200",
  SPIDER: "bg-purple-100 text-purple-800 border-purple-200",
  ECLIPSE: "bg-orange-100 text-orange-800 border-orange-200",
};

interface ResearchQuestionSuggestionsProps {
  questions: ResearchQuestion[];
  classifiedGaps: ClassifiedGap[];
  broadArea: string;
  onSelectQuestion?: (text: string) => void;
}

export function ResearchQuestionSuggestions({
  questions,
  classifiedGaps,
  broadArea,
  onSelectQuestion,
}: ResearchQuestionSuggestionsProps) {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const handleCopy = async (text: string, idx: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIdx(idx);
      toast.success("Research question copied to clipboard!");
      setTimeout(() => setCopiedIdx(null), 2000);
    } catch {
      toast.error("Failed to copy. Please copy manually.");
    }
  };

  // Dominant framework
  const counts: Record<string, number> = {};
  for (const g of classifiedGaps)
    counts[g.framework] = (counts[g.framework] || 0) + 1;
  const dominant =
    Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || "PICO";

  return (
    <div data-ocid="questions.panel">
      <div className="mb-4 p-4 bg-muted/20 rounded-xl border border-border">
        <p className="text-sm text-muted-foreground">
          Based on <strong>{classifiedGaps.length} studies</strong> analysed
          across your search results, the dominant research gap framework is{" "}
          <strong
            className={`px-1.5 py-0.5 rounded text-xs ${FRAMEWORK_COLORS[dominant]}`}
          >
            {dominant}
          </strong>
          . The following research questions are generated to address the
          identified gaps in <em>{broadArea}</em>.
        </p>
      </div>

      <div className="space-y-4">
        {questions.map((q, idx) => (
          <div
            key={q.framework + idx.toString()}
            className="border border-border rounded-xl p-5 bg-white hover:shadow-card transition-shadow"
            data-ocid={`questions.item.${idx + 1}`}
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-muted-foreground">
                  Q{idx + 1}
                </span>
                <Badge
                  className={`border text-xs font-bold ${FRAMEWORK_COLORS[q.framework]}`}
                >
                  {q.framework}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleCopy(q.text, idx)}
                  className="gap-1.5 flex-shrink-0"
                  data-ocid={`questions.button.${idx + 1}`}
                >
                  {copiedIdx === idx ? (
                    <>
                      <CheckCircle className="w-3.5 h-3.5 text-green-600" />{" "}
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Copy
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => onSelectQuestion?.(q.text)}
                  className="gap-1.5 flex-shrink-0 bg-green-700 hover:bg-green-800 text-white"
                  data-ocid={`questions.select.${idx + 1}`}
                >
                  <ChevronRight className="w-3.5 h-3.5" /> Select &amp; Refine
                </Button>
              </div>
            </div>

            <blockquote className="text-base font-semibold text-foreground leading-snug mb-3 pl-3 border-l-4 border-primary">
              {q.text}
            </blockquote>

            <p className="text-sm text-muted-foreground leading-relaxed">
              <span className="font-medium text-foreground">Rationale: </span>
              {q.rationale}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

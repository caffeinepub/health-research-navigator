import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  ChevronDown,
  ChevronRight,
  Download,
  FileText,
  Loader2,
  Lock,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { FrameworkData } from "./FrameworkSection";

interface Props {
  isOpen: boolean;
  onToggle: () => void;
  isLocked: boolean;
  broadArea: string;
  proposedGap: string;
  frameworkData: FrameworkData | null;
}

const LIMITATION_SUGGESTIONS: Record<string, string[]> = {
  PICO: [
    "Limited by randomization feasibility and ethical constraints in certain populations.",
    "Short follow-up period may not capture long-term outcomes.",
    "Potential for selection bias in participant recruitment.",
    "Blinding may not be possible for behavioral interventions.",
    "Generalizability may be limited to the studied population.",
  ],
  PICOS: [
    "Heterogeneity across included studies may limit meta-analytic pooling.",
    "Publication bias may inflate effect sizes.",
    "Grey literature and unpublished data not fully captured.",
    "Language restrictions may exclude relevant non-English studies.",
    "Variation in outcome measurement tools across included studies.",
  ],
  PECO: [
    "Exposure measurement may rely on self-report or ecological proxies.",
    "Confounding by co-exposures or socioeconomic factors.",
    "Cross-sectional design limits causal inference.",
    "Lack of biological exposure markers reduces precision.",
    "Selection bias if participation is related to exposure status.",
  ],
  SPIDER: [
    "Qualitative findings may not be generalizable beyond the study context.",
    "Researcher reflexivity may influence data interpretation.",
    "Small purposive sample limits transferability.",
    "Social desirability bias in participant responses.",
    "Context-specific findings may not translate to different settings.",
  ],
  ECLIPSE: [
    "Service evaluation data may lack the rigor of experimental design.",
    "Organizational and policy differences limit cross-site generalizability.",
    "Stakeholder access may restrict completeness of the evaluation.",
    "Rapidly changing service context may affect relevance of findings.",
    "Attribution of outcomes to specific service components is challenging.",
  ],
};

export function LimitationsPdfSection({
  isOpen,
  onToggle,
  isLocked,
  broadArea,
  proposedGap,
  frameworkData,
}: Props) {
  const [limitations, setLimitations] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // Auto-populate when framework first arrives and no limitations yet
  useEffect(() => {
    if (frameworkData) {
      setLimitations((prev) => {
        if (prev) return prev;
        const suggestions =
          LIMITATION_SUGGESTIONS[frameworkData.framework] ?? [];
        return suggestions.join("\n");
      });
    }
  }, [frameworkData]);

  const handleAddSuggestion = (text: string) => {
    setLimitations((prev) => (prev ? `${prev}\n${text}` : text));
  };

  const handleDownloadPdf = async () => {
    setIsGenerating(true);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      const contentWidth = pageWidth - margin * 2;
      let y = 20;

      const addText = (
        text: string,
        size: number,
        bold: boolean,
        color: [number, number, number],
      ) => {
        doc.setFontSize(size);
        doc.setFont("helvetica", bold ? "bold" : "normal");
        doc.setTextColor(...color);
        const lines = doc.splitTextToSize(text, contentWidth);
        doc.text(lines, margin, y);
        y += lines.length * (size * 0.4) + (bold ? 3 : 2);
      };

      const addDivider = () => {
        doc.setDrawColor(180, 200, 220);
        doc.setLineWidth(0.3);
        doc.line(margin, y, pageWidth - margin, y);
        y += 5;
      };

      const checkPageBreak = (needed: number) => {
        if (y + needed > doc.internal.pageSize.getHeight() - 20) {
          doc.addPage();
          y = 20;
        }
      };

      // Title block
      doc.setFillColor(15, 55, 100);
      doc.rect(0, 0, pageWidth, 36, "F");
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(255, 255, 255);
      doc.text("Research Study Summary", margin, 16);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(180, 210, 240);
      doc.text(
        `Generated: ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}`,
        margin,
        26,
      );
      if (frameworkData) {
        doc.text(`Framework: ${frameworkData.framework}`, margin + 90, 26);
      }
      y = 48;

      // Section 1: Research Topic
      checkPageBreak(30);
      addText("1. Research Topic", 13, true, [15, 55, 100]);
      addDivider();
      addText(broadArea || "(Not specified)", 10, false, [50, 50, 60]);
      y += 6;

      // Section 2: Research Gap
      checkPageBreak(30);
      addText("2. Research Gap", 13, true, [15, 55, 100]);
      addDivider();
      addText(proposedGap || "(Not specified)", 10, false, [50, 50, 60]);
      y += 6;

      // Section 3: Framework
      if (frameworkData) {
        checkPageBreak(40);
        addText(
          `3. Framework Classification — ${frameworkData.framework}`,
          13,
          true,
          [15, 55, 100],
        );
        addDivider();
        for (const [key, val] of Object.entries(frameworkData.fields)) {
          checkPageBreak(20);
          addText(`${key}:`, 10, true, [30, 70, 120]);
          addText(val || "(Not filled)", 10, false, [50, 50, 60]);
          y += 2;
        }
        y += 4;
      }

      // Section 4: Limitations
      checkPageBreak(30);
      addText("4. Study Limitations", 13, true, [15, 55, 100]);
      addDivider();
      const limitLines = limitations.split("\n").filter((l) => l.trim());
      for (const line of limitLines) {
        checkPageBreak(12);
        addText(`• ${line}`, 10, false, [50, 50, 60]);
        y += 1;
      }
      if (!limitLines.length) {
        addText("(No limitations specified)", 10, false, [150, 150, 160]);
      }

      // Footer
      const pages = doc.getNumberOfPages();
      for (let i = 1; i <= pages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(160, 170, 185);
        doc.text(
          `Health Research Navigator — Page ${i} of ${pages}`,
          margin,
          doc.internal.pageSize.getHeight() - 10,
        );
      }

      const fileName = `research-summary-${new Date().toISOString().slice(0, 10)}.pdf`;
      doc.save(fileName);
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const frameworkSuggestions = frameworkData
    ? (LIMITATION_SUGGESTIONS[frameworkData.framework] ?? [])
    : [];

  return (
    <div className="border-b border-border last:border-0">
      {/* Header */}
      <button
        type="button"
        data-ocid="limitations.toggle"
        onClick={onToggle}
        disabled={isLocked}
        className="w-full flex items-center justify-between px-8 py-5 text-left transition-colors"
        style={{
          background: isLocked
            ? "oklch(95% 0.01 220)"
            : isOpen
              ? "oklch(28% 0.09 255)"
              : "oklch(88% 0.06 230)",
          opacity: isLocked ? 0.7 : 1,
          cursor: isLocked ? "not-allowed" : "pointer",
        }}
      >
        <div className="flex items-center gap-3">
          <span
            className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold"
            style={{
              background: isLocked
                ? "oklch(80% 0.02 220)"
                : isOpen
                  ? "white"
                  : "oklch(28% 0.09 255)",
              color: isLocked
                ? "oklch(55% 0.04 240)"
                : isOpen
                  ? "oklch(28% 0.09 255)"
                  : "white",
            }}
          >
            4
          </span>
          <span
            className="font-semibold text-base"
            style={{
              color: isLocked
                ? "oklch(55% 0.04 240)"
                : isOpen
                  ? "white"
                  : "oklch(28% 0.09 255)",
            }}
          >
            Limitations & PDF Export
          </span>
          {isLocked && <Lock size={14} className="text-muted-foreground" />}
          {!isLocked && (
            <span
              className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
              style={{
                background: isOpen
                  ? "rgba(255,255,255,0.2)"
                  : "oklch(75% 0.09 240)",
                color: isOpen ? "white" : "oklch(28% 0.09 255)",
              }}
            >
              <FileText size={11} /> PDF
            </span>
          )}
        </div>
        {!isLocked &&
          (isOpen ? (
            <ChevronDown size={20} color="white" />
          ) : (
            <ChevronRight size={20} color="oklch(35% 0.08 240)" />
          ))}
      </button>

      {/* Body */}
      {isOpen && !isLocked && (
        <div className="px-8 py-7 space-y-6">
          {/* Framework badge */}
          {frameworkData && (
            <div
              className="rounded-md px-4 py-3 border flex items-center gap-3"
              style={{
                background: "oklch(94% 0.05 240)",
                borderColor: "oklch(78% 0.1 240)",
              }}
            >
              <span
                className="text-xs font-semibold uppercase tracking-wide"
                style={{ color: "oklch(35% 0.1 240)" }}
              >
                Framework:
              </span>
              <span
                className="px-2 py-0.5 rounded text-sm font-bold"
                style={{ background: "oklch(35% 0.14 240)", color: "white" }}
              >
                {frameworkData.framework}
              </span>
              <span className="text-xs text-muted-foreground ml-auto">
                {Object.keys(frameworkData.fields).length} components classified
              </span>
            </div>
          )}

          {/* Limitations textarea */}
          <div>
            <label
              htmlFor="limitations-textarea"
              className="block text-sm font-semibold mb-1"
              style={{ color: "oklch(28% 0.09 255)" }}
            >
              Study Limitations
            </label>
            <p className="text-xs text-muted-foreground mb-3">
              Describe the limitations of your proposed study. Each line will
              appear as a bullet point in the PDF.
            </p>
            <Textarea
              id="limitations-textarea"
              data-ocid="limitations.textarea"
              value={limitations}
              onChange={(e) => setLimitations(e.target.value)}
              placeholder={
                "e.g., Sample size constraints may reduce statistical power.\nCross-sectional design limits causal inference.\nSelf-report bias may affect accuracy of outcome measures.\nFindings may not generalise beyond the study population."
              }
              className="min-h-[140px] text-sm resize-none border-border focus-visible:ring-primary"
            />
          </div>

          {/* Suggestions */}
          {frameworkSuggestions.length > 0 && (
            <div>
              <p
                className="text-xs font-semibold uppercase tracking-wide mb-2"
                style={{ color: "oklch(35% 0.08 240)" }}
              >
                Common {frameworkData?.framework} Limitations — click to add
              </p>
              <div className="flex flex-wrap gap-2">
                {frameworkSuggestions.map((s, i) => (
                  <button
                    key={s.slice(0, 30)}
                    type="button"
                    data-ocid={`limitations.item.${i + 1}`}
                    onClick={() => handleAddSuggestion(s)}
                    className="text-xs px-3 py-1.5 rounded-full border transition-all hover:shadow-sm text-left"
                    style={{
                      borderColor: "oklch(75% 0.1 240)",
                      background: "oklch(95% 0.04 240)",
                      color: "oklch(35% 0.1 240)",
                    }}
                  >
                    + {s.length > 60 ? `${s.slice(0, 60)}...` : s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* PDF Summary Preview */}
          <div
            className="rounded-xl border p-5 space-y-3"
            style={{
              background: "oklch(97% 0.008 220)",
              borderColor: "oklch(85% 0.04 230)",
            }}
          >
            <p
              className="text-xs font-semibold uppercase tracking-wide"
              style={{ color: "oklch(35% 0.08 240)" }}
            >
              PDF will include
            </p>
            <ul className="space-y-2">
              {[
                {
                  num: "1",
                  label: "Research Topic",
                  preview:
                    broadArea.slice(0, 80) +
                    (broadArea.length > 80 ? "..." : ""),
                },
                {
                  num: "2",
                  label: "Research Gap",
                  preview:
                    proposedGap.slice(0, 80) +
                    (proposedGap.length > 80 ? "..." : ""),
                },
                {
                  num: "3",
                  label: `Framework (${frameworkData?.framework ?? "—"})`,
                  preview: frameworkData
                    ? Object.keys(frameworkData.fields).join(" · ")
                    : "(complete Step 3)",
                },
                {
                  num: "4",
                  label: "Study Limitations",
                  preview: limitations
                    ? `${limitations.split("\n").filter((l) => l.trim()).length} limitation(s) listed`
                    : "(none entered)",
                },
              ].map((item) => (
                <li key={item.num} className="flex items-start gap-3">
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
                    style={{
                      background: "oklch(49% 0.11 240)",
                      color: "white",
                    }}
                  >
                    {item.num}
                  </span>
                  <div>
                    <span
                      className="text-xs font-semibold"
                      style={{ color: "oklch(28% 0.09 255)" }}
                    >
                      {item.label}
                    </span>
                    {item.preview && (
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                        {item.preview}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Download button */}
          <div className="flex justify-end pt-2">
            <Button
              data-ocid="limitations.primary_button"
              onClick={handleDownloadPdf}
              disabled={isGenerating}
              className="gap-2 font-semibold px-6"
              style={{ background: "oklch(28% 0.09 255)", color: "white" }}
            >
              {isGenerating ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Generating
                  PDF...
                </>
              ) : (
                <>
                  <Download size={16} /> Download PDF
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Locked state */}
      {isLocked && (
        <div className="px-8 py-5">
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Lock size={14} />
            Complete Step 3 — Framework Classification — to unlock this section.
          </p>
        </div>
      )}
    </div>
  );
}

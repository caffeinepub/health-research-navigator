import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Loader2,
  Lock,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useActor } from "../hooks/useActor";

interface Props {
  isOpen: boolean;
  onToggle: () => void;
  isLocked: boolean;
  broadArea: string;
  onGapComplete?: (proposedGap: string) => void;
}

interface FieldDef {
  id: string;
  label: string;
  description: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  ocid: string;
}

export function ResearchGapSection({
  isOpen,
  onToggle,
  isLocked,
  broadArea,
  onGapComplete,
}: Props) {
  const { actor } = useActor();
  const [whatIsKnown, setWhatIsKnown] = useState("");
  const [whatIsContested, setWhatIsContested] = useState("");
  const [whatIsMissing, setWhatIsMissing] = useState("");
  const [proposedGap, setProposedGap] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const queryClient = useQueryClient();

  const handleSave = async () => {
    if (!broadArea.trim() || !proposedGap.trim()) {
      toast.error(
        "Please fill in the Broad Area and the Proposed Gap Statement.",
      );
      return;
    }
    if (!actor) {
      toast.error("Not connected to backend.");
      return;
    }
    setIsSaving(true);
    try {
      await actor.saveSession(
        broadArea,
        whatIsKnown,
        whatIsContested,
        whatIsMissing,
        proposedGap,
      );
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      setSaved(true);
      toast.success("Research session saved!");
    } catch {
      toast.error("Failed to save session.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleContinueToFramework = () => {
    if (!proposedGap.trim()) {
      toast.error(
        "Please fill in the Proposed Gap Statement before continuing.",
      );
      return;
    }
    onGapComplete?.(proposedGap);
  };

  const fields: FieldDef[] = [
    {
      id: "known",
      label: "What is already known?",
      description:
        "Summarize what the existing literature covers about your broad area.",
      value: whatIsKnown,
      onChange: setWhatIsKnown,
      placeholder:
        "e.g., Several systematic reviews have established a link between hypertension and cardiovascular events in Western populations...",
      ocid: "gap.input",
    },
    {
      id: "contested",
      label: "What is contested or inconsistent?",
      description:
        "Note conflicting findings, methodological disagreements, or under-studied populations.",
      value: whatIsContested,
      onChange: setWhatIsContested,
      placeholder:
        "e.g., Studies conflict on whether dietary interventions alone are sufficient without pharmacological support, particularly in South Asian populations...",
      ocid: "gap.textarea",
    },
    {
      id: "missing",
      label: "What is missing?",
      description:
        "Identify the specific gap — what has not been studied, is understudied, or requires updated evidence.",
      value: whatIsMissing,
      onChange: setWhatIsMissing,
      placeholder:
        "e.g., No large-scale longitudinal studies exist examining the role of community health workers in hypertension management in rural India...",
      ocid: "gap.search_input",
    },
    {
      id: "proposed",
      label: "Proposed Gap Statement",
      description:
        "Articulate your research gap clearly and concisely. This becomes the foundation of your research question.",
      value: proposedGap,
      onChange: setProposedGap,
      placeholder:
        "e.g., Despite evidence linking social determinants to cardiovascular risk, there is a paucity of research investigating the effectiveness of community-based interventions in reducing hypertension burden in low-income urban populations in India.",
      ocid: "gap.editor",
    },
  ];

  return (
    <div className="border-b border-border last:border-0">
      {/* Header */}
      <button
        type="button"
        data-ocid="gap.toggle"
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
            2
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
            Research Gap
          </span>
          {isLocked && <Lock size={14} className="text-muted-foreground" />}
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
          {/* Explainer */}
          <div
            className="rounded-lg p-4 border"
            style={{
              background: "oklch(95% 0.03 240)",
              borderColor: "oklch(80% 0.06 240)",
            }}
          >
            <p
              className="text-sm font-semibold mb-1"
              style={{ color: "oklch(35% 0.08 240)" }}
            >
              What is a Research Gap?
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              A research gap is a question or problem that has not been answered
              by any existing studies in your field. It can be a missing piece
              of evidence, an unstudied population, a methodological limitation,
              or conflicting findings that require resolution. Identifying a gap
              justifies the need for your research.
            </p>
          </div>

          {/* Broad area display */}
          <div
            className="rounded-md border border-border px-4 py-3"
            style={{ background: "oklch(97% 0.008 220)" }}
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
              Your Broad Area
            </p>
            <p className="text-sm" style={{ color: "oklch(28% 0.09 255)" }}>
              {broadArea}
            </p>
          </div>

          {/* Fields */}
          {fields.map((field) => (
            <div key={field.id}>
              <label
                htmlFor={`gap-field-${field.id}`}
                className="block text-sm font-semibold mb-1"
                style={{ color: "oklch(28% 0.09 255)" }}
              >
                {field.label}
              </label>
              <p className="text-xs text-muted-foreground mb-2">
                {field.description}
              </p>
              <Textarea
                id={`gap-field-${field.id}`}
                data-ocid={field.ocid}
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
                placeholder={field.placeholder}
                className="min-h-[90px] text-sm resize-none border-border focus-visible:ring-primary"
              />
            </div>
          ))}

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            {saved && (
              <div
                data-ocid="gap.success_state"
                className="flex items-center gap-2 text-sm"
                style={{ color: "oklch(45% 0.15 150)" }}
              >
                <CheckCircle2 size={16} />
                Session saved successfully
              </div>
            )}
            <div className="ml-auto flex items-center gap-3">
              <Button
                data-ocid="gap.submit_button"
                onClick={handleSave}
                disabled={isSaving || !proposedGap.trim()}
                variant="outline"
                className="gap-2 font-semibold border-primary text-primary hover:bg-primary hover:text-white"
              >
                {isSaving ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Saving...
                  </>
                ) : (
                  "Save Session"
                )}
              </Button>
              <Button
                data-ocid="gap.primary_button"
                onClick={handleContinueToFramework}
                disabled={!proposedGap.trim()}
                className="gap-2 font-semibold"
                style={{ background: "oklch(28% 0.09 255)", color: "white" }}
              >
                Continue to Framework →
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Locked state */}
      {isLocked && (
        <div className="px-8 py-5">
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Lock size={14} />
            Complete Step 1 — Broad Area of Research — to unlock this section.
          </p>
        </div>
      )}
    </div>
  );
}

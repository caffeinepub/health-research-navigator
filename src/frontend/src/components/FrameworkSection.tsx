import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ChevronDown, ChevronRight, Lightbulb, Lock } from "lucide-react";
import { useEffect, useState } from "react";

export interface FrameworkData {
  framework: string;
  fields: Record<string, string>;
}

interface Props {
  isOpen: boolean;
  onToggle: () => void;
  isLocked: boolean;
  broadArea: string;
  proposedGap: string;
  onFrameworkComplete: (data: FrameworkData) => void;
}

const FRAMEWORKS: {
  id: string;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  bestFor: string;
  fields: { key: string; label: string; hint: string }[];
}[] = [
  {
    id: "PICO",
    label: "PICO",
    color: "oklch(35% 0.18 240)",
    bgColor: "oklch(93% 0.07 240)",
    borderColor: "oklch(75% 0.12 240)",
    bestFor: "Clinical interventions & randomised trials",
    fields: [
      {
        key: "Population",
        label: "P — Population",
        hint: "Who is the target population? (e.g., adults with type 2 diabetes)",
      },
      {
        key: "Intervention",
        label: "I — Intervention",
        hint: "What is the intervention or exposure? (e.g., low-carb diet)",
      },
      {
        key: "Comparison",
        label: "C — Comparison",
        hint: "What is the comparator or control? (e.g., standard diet advice)",
      },
      {
        key: "Outcome",
        label: "O — Outcome",
        hint: "What is the primary outcome? (e.g., HbA1c reduction at 6 months)",
      },
    ],
  },
  {
    id: "PICOS",
    label: "PICOS",
    color: "oklch(35% 0.18 270)",
    bgColor: "oklch(93% 0.06 270)",
    borderColor: "oklch(75% 0.11 270)",
    bestFor: "Systematic reviews & meta-analyses",
    fields: [
      {
        key: "Population",
        label: "P — Population",
        hint: "Who is the target population?",
      },
      {
        key: "Intervention",
        label: "I — Intervention",
        hint: "What is the intervention?",
      },
      {
        key: "Comparison",
        label: "C — Comparison",
        hint: "What is the comparator?",
      },
      {
        key: "Outcome",
        label: "O — Outcome",
        hint: "What are the primary outcomes?",
      },
      {
        key: "StudyDesign",
        label: "S — Study Design",
        hint: "What study types are included? (e.g., RCTs, cohort studies)",
      },
    ],
  },
  {
    id: "PECO",
    label: "PECO",
    color: "oklch(38% 0.15 155)",
    bgColor: "oklch(93% 0.06 155)",
    borderColor: "oklch(75% 0.12 155)",
    bestFor: "Epidemiology & environmental health research",
    fields: [
      {
        key: "Population",
        label: "P — Population",
        hint: "Who is the affected population?",
      },
      {
        key: "Exposure",
        label: "E — Exposure",
        hint: "What is the environmental or risk exposure? (e.g., air pollution)",
      },
      {
        key: "Comparison",
        label: "C — Comparison",
        hint: "Unexposed group or alternative exposure level",
      },
      {
        key: "Outcome",
        label: "O — Outcome",
        hint: "What health outcome is measured?",
      },
    ],
  },
  {
    id: "SPIDER",
    label: "SPIDER",
    color: "oklch(40% 0.15 45)",
    bgColor: "oklch(94% 0.05 50)",
    borderColor: "oklch(78% 0.1 50)",
    bestFor: "Qualitative & mixed-methods research",
    fields: [
      {
        key: "Sample",
        label: "S — Sample",
        hint: "Who are the participants? (e.g., nurses in ICU settings)",
      },
      {
        key: "Phenomenon",
        label: "PI — Phenomenon of Interest",
        hint: "What experience or behaviour is being studied?",
      },
      {
        key: "Design",
        label: "D — Design",
        hint: "What is the study design? (e.g., grounded theory, phenomenology)",
      },
      {
        key: "Evaluation",
        label: "E — Evaluation",
        hint: "How is the outcome evaluated? (e.g., thematic analysis)",
      },
      {
        key: "ResearchType",
        label: "R — Research Type",
        hint: "Qualitative, quantitative, or mixed methods?",
      },
    ],
  },
  {
    id: "ECLIPSE",
    label: "ECLIPSE",
    color: "oklch(38% 0.16 15)",
    bgColor: "oklch(94% 0.05 15)",
    borderColor: "oklch(78% 0.11 15)",
    bestFor: "Health services management & policy",
    fields: [
      {
        key: "Expectation",
        label: "E — Expectation",
        hint: "What improvement or outcome is expected?",
      },
      {
        key: "ClientGroup",
        label: "C — Client Group",
        hint: "Who is the client or beneficiary group?",
      },
      {
        key: "Location",
        label: "L — Location",
        hint: "Where is the service delivered? (e.g., rural primary care)",
      },
      {
        key: "Impact",
        label: "I — Impact",
        hint: "What is the measured impact or effect?",
      },
      {
        key: "Professionals",
        label: "P — Professionals",
        hint: "Who are the service providers involved?",
      },
      {
        key: "Service",
        label: "SE — Service",
        hint: "What type of service or intervention is described?",
      },
    ],
  },
];

function suggestFramework(text: string): string | null {
  const lower = text.toLowerCase();
  if (
    /qualitative|experience|perception|phenomeno|grounded|narrative|focus group/.test(
      lower,
    )
  )
    return "SPIDER";
  if (
    /service|management|organization|policy|commission|delivery|system/.test(
      lower,
    )
  )
    return "ECLIPSE";
  if (/exposure|environmental|pollution|occupational|risk factor/.test(lower))
    return "PECO";
  if (
    /systematic review|meta.analys|multiple stud|evidence synthes/.test(lower)
  )
    return "PICOS";
  if (
    /intervention|treatment|drug|therapy|clinical trial|rct|randomis/.test(
      lower,
    )
  )
    return "PICO";
  return null;
}

export function FrameworkSection({
  isOpen,
  onToggle,
  isLocked,
  broadArea,
  proposedGap,
  onFrameworkComplete,
}: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [autoSuggestion, setAutoSuggestion] = useState<string | null>(null);

  useEffect(() => {
    const combined = `${broadArea} ${proposedGap}`;
    const suggestion = suggestFramework(combined);
    setAutoSuggestion(suggestion);
    // Only auto-select if user hasn't already picked one
    setSelectedId((prev) => {
      if (suggestion && !prev) {
        setFields({});
        return suggestion;
      }
      return prev;
    });
  }, [broadArea, proposedGap]);

  const selectedFramework = FRAMEWORKS.find((f) => f.id === selectedId);

  const handleSelectFramework = (id: string) => {
    setSelectedId(id);
    setFields({});
  };

  const handleFieldChange = (key: string, value: string) => {
    setFields((prev) => ({ ...prev, [key]: value }));
  };

  const isComplete = selectedFramework
    ? selectedFramework.fields.every(
        (f) => (fields[f.key] ?? "").trim().length > 0,
      )
    : false;

  const handleContinue = () => {
    if (!selectedId || !selectedFramework) return;
    onFrameworkComplete({ framework: selectedId, fields });
  };

  return (
    <div className="border-b border-border last:border-0">
      {/* Header */}
      <button
        type="button"
        data-ocid="framework.toggle"
        onClick={onToggle}
        disabled={isLocked}
        className="w-full flex items-center justify-between px-8 py-5 text-left transition-colors"
        style={{
          background: isLocked
            ? "oklch(95% 0.01 220)"
            : isOpen
              ? "oklch(49% 0.11 240)"
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
                  : "oklch(49% 0.11 240)",
              color: isLocked
                ? "oklch(55% 0.04 240)"
                : isOpen
                  ? "oklch(49% 0.11 240)"
                  : "white",
            }}
          >
            3
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
            Framework Classification
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
          {/* Quick rule hint */}
          <div
            className="rounded-lg p-4 border flex items-start gap-3"
            style={{
              background: "oklch(96% 0.04 55)",
              borderColor: "oklch(82% 0.1 55)",
            }}
          >
            <Lightbulb
              size={16}
              className="mt-0.5 shrink-0"
              style={{ color: "oklch(52% 0.14 55)" }}
            />
            <div>
              <p
                className="text-sm font-semibold mb-1"
                style={{ color: "oklch(35% 0.1 50)" }}
              >
                Quick Selection Guide
              </p>
              <ul
                className="text-xs space-y-0.5"
                style={{ color: "oklch(42% 0.08 50)" }}
              >
                <li>
                  • <strong>Intervention/Treatment present</strong> → PICO or
                  PICOS
                </li>
                <li>
                  • <strong>Systematic review focus</strong> → PICOS
                </li>
                <li>
                  • <strong>Environmental/Risk exposure</strong> → PECO
                </li>
                <li>
                  • <strong>Qualitative or experiential focus</strong> → SPIDER
                </li>
                <li>
                  • <strong>Health service/policy/management</strong> → ECLIPSE
                </li>
              </ul>
            </div>
          </div>

          {/* Auto-suggestion */}
          {autoSuggestion && (
            <div
              className="rounded-md px-4 py-2.5 border text-sm flex items-center gap-2"
              style={{
                background: "oklch(94% 0.06 240)",
                borderColor: "oklch(75% 0.1 240)",
              }}
            >
              <span style={{ color: "oklch(35% 0.12 240)" }}>
                ✦ Based on your topic, we suggest:{" "}
                <strong>{autoSuggestion}</strong> framework
              </span>
            </div>
          )}

          {/* Framework cards */}
          <div>
            <p
              className="text-xs font-semibold uppercase tracking-wide mb-3"
              style={{ color: "oklch(35% 0.08 240)" }}
            >
              Select a Framework
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {FRAMEWORKS.map((fw) => {
                const isSelected = selectedId === fw.id;
                return (
                  <button
                    key={fw.id}
                    type="button"
                    data-ocid={`framework.${fw.id.toLowerCase()}.button`}
                    onClick={() => handleSelectFramework(fw.id)}
                    className="text-left rounded-xl border-2 p-4 transition-all hover:shadow-md"
                    style={{
                      borderColor: isSelected ? fw.color : fw.borderColor,
                      background: isSelected ? fw.bgColor : "white",
                      boxShadow: isSelected
                        ? `0 0 0 2px ${fw.color}40`
                        : undefined,
                    }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span
                        className="text-lg font-bold tracking-tight"
                        style={{ color: fw.color }}
                      >
                        {fw.label}
                      </span>
                      {isSelected && (
                        <Badge
                          className="text-xs"
                          style={{ background: fw.color, color: "white" }}
                        >
                          Selected
                        </Badge>
                      )}
                    </div>
                    <p
                      className="text-xs"
                      style={{ color: "oklch(45% 0.04 240)" }}
                    >
                      {fw.bestFor}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1">
                      {fw.fields.map((f) => (
                        <span
                          key={f.key}
                          className="text-xs px-1.5 py-0.5 rounded font-medium"
                          style={{ background: fw.bgColor, color: fw.color }}
                        >
                          {f.key}
                        </span>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected framework fields */}
          {selectedFramework && (
            <div
              className="rounded-xl border-2 p-6 space-y-5"
              style={{
                borderColor: selectedFramework.borderColor,
                background: `${selectedFramework.bgColor}70`,
              }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="text-base font-bold"
                  style={{ color: selectedFramework.color }}
                >
                  {selectedFramework.label} Components
                </span>
                <span className="text-xs text-muted-foreground">
                  — Fill all fields to continue
                </span>
              </div>

              {selectedFramework.fields.map((f) => (
                <div key={f.key}>
                  <label
                    htmlFor={`fw-field-${f.key}`}
                    className="block text-sm font-semibold mb-1"
                    style={{ color: selectedFramework.color }}
                  >
                    {f.label}
                  </label>
                  <p className="text-xs text-muted-foreground mb-2">{f.hint}</p>
                  <Textarea
                    id={`fw-field-${f.key}`}
                    data-ocid={`framework.${f.key.toLowerCase()}.input`}
                    value={fields[f.key] ?? ""}
                    onChange={(e) => handleFieldChange(f.key, e.target.value)}
                    placeholder={f.hint}
                    className="min-h-[72px] text-sm resize-none"
                    style={{ borderColor: selectedFramework.borderColor }}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Continue */}
          <div className="flex justify-end pt-2">
            <Button
              data-ocid="framework.primary_button"
              onClick={handleContinue}
              disabled={!isComplete}
              className="gap-2 font-semibold"
              style={{ background: "oklch(49% 0.11 240)", color: "white" }}
            >
              Continue to Limitations & Export →
            </Button>
          </div>
        </div>
      )}

      {/* Locked state */}
      {isLocked && (
        <div className="px-8 py-5">
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Lock size={14} />
            Complete Step 2 — Research Gap — to unlock this section.
          </p>
        </div>
      )}
    </div>
  );
}

import { Toaster } from "@/components/ui/sonner";
import { useState } from "react";
import { toast } from "sonner";
import { BroadAreaSection } from "./components/BroadAreaSection";
import {
  type FrameworkData,
  FrameworkSection,
} from "./components/FrameworkSection";
import { LimitationsPdfSection } from "./components/LimitationsPdfSection";
import { ResearchGapSection } from "./components/ResearchGapSection";
import { SavedSessions } from "./components/SavedSessions";
import { useAllSessions, useDeleteSession } from "./hooks/useQueries";

export default function App() {
  const [broadArea, setBroadArea] = useState("");
  const [proposedGap, setProposedGap] = useState("");
  const [frameworkData, setFrameworkData] = useState<FrameworkData | null>(
    null,
  );
  const [openSection, setOpenSection] = useState<
    "broad" | "gap" | "framework" | "limitations" | null
  >("broad");

  const { data: sessions = [], isLoading: sessionsLoading } = useAllSessions();
  const deleteMutation = useDeleteSession();

  const handleBroadAreaComplete = () => {
    if (broadArea.trim().length > 10) {
      setOpenSection("gap");
    } else {
      toast.error(
        "Please describe your broad area in more detail before proceeding.",
      );
    }
  };

  const handleGapComplete = (gap: string) => {
    setProposedGap(gap);
    setOpenSection("framework");
  };

  const handleFrameworkComplete = (data: FrameworkData) => {
    setFrameworkData(data);
    setOpenSection("limitations");
  };

  const handleDeleteSession = async (id: bigint) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success("Session deleted.");
    } catch {
      toast.error("Failed to delete session.");
    }
  };

  const isGapUnlocked = broadArea.trim().length > 0;
  const isFrameworkUnlocked = proposedGap.trim().length > 0;
  const isLimitationsUnlocked = frameworkData !== null;

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background:
          "linear-gradient(160deg, #EAF2F8 0%, #F7FAFC 60%, #ffffff 100%)",
      }}
    >
      <Toaster richColors position="top-right" />

      {/* Header */}
      <header className="bg-white/80 backdrop-blur border-b border-border shadow-sm sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: "oklch(49% 0.11 240)" }}
            aria-hidden="true"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              role="img"
              aria-label="Health Research Navigator logo"
            >
              <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18" />
            </svg>
          </div>
          <div>
            <h1
              className="text-base font-bold leading-tight"
              style={{ color: "oklch(28% 0.09 255)" }}
            >
              Health Research Navigator
            </h1>
            <p className="text-xs text-muted-foreground leading-tight">
              A guided tool for health researchers
            </p>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-12 px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <span
            className="inline-block text-xs font-semibold tracking-widest uppercase px-3 py-1 rounded-full mb-4"
            style={{
              background: "oklch(88% 0.06 230)",
              color: "oklch(35% 0.08 240)",
            }}
          >
            Health Research Synthesis Tool
          </span>
          <h2
            className="font-serif text-4xl font-normal mb-3"
            style={{ color: "oklch(28% 0.09 255)" }}
          >
            From Broad Topic to Research Gap
          </h2>
          <p className="text-muted-foreground text-base max-w-lg mx-auto">
            Define your research domain, search global literature databases,
            identify your gap, classify using an evidence framework, and export
            a structured PDF summary.
          </p>
        </div>
      </section>

      {/* Main tool card */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-6 pb-16">
        <div className="bg-white rounded-2xl border border-border shadow-elevated overflow-hidden">
          {/* Card header */}
          <div
            className="px-8 py-5 border-b border-border"
            style={{ background: "oklch(28% 0.09 255)" }}
          >
            <h3 className="text-white font-semibold text-lg">
              Research Question Builder
            </h3>
            <p className="text-white/70 text-sm mt-0.5">
              Complete each step sequentially to build a well-structured
              research question
            </p>
          </div>

          {/* Step 1 */}
          <BroadAreaSection
            isOpen={openSection === "broad"}
            onToggle={() =>
              setOpenSection(openSection === "broad" ? null : "broad")
            }
            broadArea={broadArea}
            onBroadAreaChange={setBroadArea}
            onComplete={handleBroadAreaComplete}
          />

          {/* Step 2 */}
          <ResearchGapSection
            isOpen={openSection === "gap"}
            onToggle={() =>
              isGapUnlocked &&
              setOpenSection(openSection === "gap" ? null : "gap")
            }
            isLocked={!isGapUnlocked}
            broadArea={broadArea}
            onGapComplete={handleGapComplete}
          />

          {/* Step 3 */}
          <FrameworkSection
            isOpen={openSection === "framework"}
            onToggle={() =>
              isFrameworkUnlocked &&
              setOpenSection(openSection === "framework" ? null : "framework")
            }
            isLocked={!isFrameworkUnlocked}
            broadArea={broadArea}
            proposedGap={proposedGap}
            onFrameworkComplete={handleFrameworkComplete}
          />

          {/* Step 4 */}
          <LimitationsPdfSection
            isOpen={openSection === "limitations"}
            onToggle={() =>
              isLimitationsUnlocked &&
              setOpenSection(
                openSection === "limitations" ? null : "limitations",
              )
            }
            isLocked={!isLimitationsUnlocked}
            broadArea={broadArea}
            proposedGap={proposedGap}
            frameworkData={frameworkData}
          />
        </div>

        {/* Saved Sessions */}
        <SavedSessions
          sessions={sessions}
          isLoading={sessionsLoading}
          onDelete={handleDeleteSession}
          isDeleting={deleteMutation.isPending}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-white/60 px-6 py-4 text-center">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()}. Built with ❤️ using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}

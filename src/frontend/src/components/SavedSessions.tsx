import { Button } from "@/components/ui/button";
import { BookOpen, Loader2, Trash2 } from "lucide-react";
import type { ResearchSession } from "../backend.d";

interface Props {
  sessions: ResearchSession[];
  isLoading: boolean;
  onDelete: (id: bigint) => void;
  isDeleting: boolean;
}

export function SavedSessions({
  sessions,
  isLoading,
  onDelete,
  isDeleting,
}: Props) {
  if (isLoading) {
    return (
      <div className="mt-10">
        <h3
          className="text-base font-semibold mb-4"
          style={{ color: "oklch(28% 0.09 255)" }}
        >
          Saved Research Sessions
        </h3>
        <div
          data-ocid="sessions.loading_state"
          className="flex items-center gap-2 text-sm text-muted-foreground"
        >
          <Loader2 size={16} className="animate-spin" /> Loading sessions...
        </div>
      </div>
    );
  }

  return (
    <div className="mt-10">
      <div className="flex items-center gap-2 mb-5">
        <BookOpen size={18} style={{ color: "oklch(49% 0.11 240)" }} />
        <h3
          className="text-base font-semibold"
          style={{ color: "oklch(28% 0.09 255)" }}
        >
          Saved Research Sessions
        </h3>
        {sessions.length > 0 && (
          <span className="ml-auto text-xs text-muted-foreground">
            {sessions.length} session{sessions.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {sessions.length === 0 && (
        <div
          data-ocid="sessions.empty_state"
          className="bg-white rounded-xl border border-border px-8 py-12 text-center shadow-card"
        >
          <div
            className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center"
            style={{ background: "oklch(88% 0.06 230)" }}
          >
            <BookOpen size={22} style={{ color: "oklch(49% 0.11 240)" }} />
          </div>
          <p className="text-sm font-medium text-foreground mb-1">
            No saved sessions yet
          </p>
          <p className="text-xs text-muted-foreground">
            Complete a research session above and save it to see it here.
          </p>
        </div>
      )}

      {sessions.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sessions.map((session, i) => (
            <div
              key={String(session.id)}
              data-ocid={`sessions.item.${i + 1}`}
              className="bg-white rounded-xl border border-border p-5 shadow-card hover:shadow-elevated transition-shadow"
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <p
                  className="text-sm font-semibold leading-snug line-clamp-2"
                  style={{ color: "oklch(28% 0.09 255)" }}
                >
                  {session.broadArea || "Untitled Session"}
                </p>
                <Button
                  variant="ghost"
                  size="icon"
                  data-ocid={`sessions.delete_button.${i + 1}`}
                  onClick={() => onDelete(session.id)}
                  disabled={isDeleting}
                  className="shrink-0 h-7 w-7 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 size={14} />
                </Button>
              </div>
              {session.proposedGap && (
                <div className="mt-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                    Research Gap
                  </p>
                  <p className="text-xs text-foreground/80 line-clamp-3 leading-relaxed">
                    {session.proposedGap}
                  </p>
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-3">
                {new Date(
                  Number(session.timestamp) / 1_000_000,
                ).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

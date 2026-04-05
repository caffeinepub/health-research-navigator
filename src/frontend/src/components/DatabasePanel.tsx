import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import type { Study } from "../types/study";

interface DatabasePanelProps {
  name: string;
  dbKey: string;
  studies: Study[];
  status: "idle" | "loading" | "success" | "error";
  errorMsg?: string;
  selectedIds: Set<string>;
  onToggleSelect: (study: Study) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
  accentClass: string;
  accentBg: string;
}

export function DatabasePanel({
  name,
  dbKey,
  studies,
  status,
  errorMsg,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onClearAll,
  accentClass,
  accentBg,
}: DatabasePanelProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [expandedStudy, setExpandedStudy] = useState<string | null>(null);

  const selectedCount = studies.filter((s) => selectedIds.has(s.id)).length;

  return (
    <div
      className="border border-border rounded-xl overflow-hidden mb-3"
      data-ocid={`${dbKey}.panel`}
    >
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-muted/30 transition-colors"
        aria-expanded={isOpen}
        data-ocid={`${dbKey}.toggle`}
      >
        <div className="flex items-center gap-2.5">
          <span className={`w-2.5 h-2.5 rounded-full ${accentBg}`} />
          <span className="font-semibold text-sm text-foreground">{name}</span>
          {status === "success" && (
            <Badge variant="secondary" className="text-xs">
              {studies.length} results
            </Badge>
          )}
          {status === "loading" && (
            <Badge variant="outline" className="text-xs">
              Searching…
            </Badge>
          )}
          {status === "error" && (
            <Badge variant="destructive" className="text-xs">
              Error
            </Badge>
          )}
          {selectedCount > 0 && (
            <Badge className={`text-xs text-white ${accentBg}`}>
              {selectedCount} selected
            </Badge>
          )}
        </div>
        {isOpen ? (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      {isOpen && (
        <div className="border-t border-border">
          {status === "loading" && (
            <div className="p-4 space-y-3" data-ocid={`${dbKey}.loading_state`}>
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-1.5">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          )}

          {status === "error" && (
            <div
              className="p-4 flex items-center gap-2 text-destructive text-sm"
              data-ocid={`${dbKey}.error_state`}
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>
                {errorMsg || "Failed to fetch results. Please try again."}
              </span>
            </div>
          )}

          {status === "success" && studies.length === 0 && (
            <div
              className="p-4 text-sm text-muted-foreground"
              data-ocid={`${dbKey}.empty_state`}
            >
              No results found for this query.
            </div>
          )}

          {status === "success" && studies.length > 0 && (
            <>
              <div className="flex gap-2 px-4 py-2 border-b border-border bg-muted/20">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onSelectAll}
                  className="text-xs h-7"
                  data-ocid={`${dbKey}.toggle`}
                >
                  Select All
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onClearAll}
                  className="text-xs h-7"
                  data-ocid={`${dbKey}.secondary_button`}
                >
                  Clear
                </Button>
              </div>
              <div className="divide-y divide-border">
                {studies.map((study, idx) => (
                  <StudyRow
                    key={study.id}
                    study={study}
                    index={idx + 1}
                    dbKey={dbKey}
                    isSelected={selectedIds.has(study.id)}
                    isExpanded={expandedStudy === study.id}
                    onToggleExpand={() =>
                      setExpandedStudy(
                        expandedStudy === study.id ? null : study.id,
                      )
                    }
                    onToggleSelect={() => onToggleSelect(study)}
                    accentClass={accentClass}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function StudyRow({
  study,
  index,
  dbKey,
  isSelected,
  isExpanded,
  onToggleExpand,
  onToggleSelect,
  accentClass,
}: {
  study: Study;
  index: number;
  dbKey: string;
  isSelected: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onToggleSelect: () => void;
  accentClass: string;
}) {
  const authorDisplay =
    study.authors.length === 0
      ? "Unknown"
      : study.authors.length <= 2
        ? study.authors.join(", ")
        : `${study.authors[0]} et al.`;

  return (
    <div
      className={`px-4 py-3 hover:bg-muted/10 transition-colors ${isSelected ? "bg-blue-50/60" : ""}`}
      data-ocid={`${dbKey}.item.${index}`}
    >
      <div className="flex items-start gap-3">
        <Checkbox
          id={`chk-${study.id}`}
          checked={isSelected}
          onCheckedChange={onToggleSelect}
          className="mt-0.5 flex-shrink-0"
          data-ocid={`${dbKey}.checkbox.${index}`}
        />
        <div className="flex-1 min-w-0">
          <button
            type="button"
            onClick={onToggleExpand}
            className="text-left w-full"
          >
            <p
              className={`text-sm font-medium leading-snug ${accentClass} hover:underline line-clamp-2`}
            >
              {study.title}
            </p>
          </button>
          <p className="text-xs text-muted-foreground mt-0.5">
            {authorDisplay}
            {study.year ? ` · ${study.year}` : ""}
            {study.journal ? ` · ${study.journal}` : ""}
          </p>

          {isExpanded && study.abstract && (
            <div className="mt-2 p-3 bg-muted/20 rounded-lg">
              <p className="text-xs text-foreground/80 leading-relaxed line-clamp-6">
                {study.abstract}
              </p>
            </div>
          )}
          {isExpanded && !study.abstract && (
            <p className="text-xs text-muted-foreground mt-1 italic">
              Abstract not available
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onToggleExpand}
          className="flex-shrink-0 text-muted-foreground hover:text-foreground"
          aria-label={isExpanded ? "Collapse" : "Expand"}
        >
          {isExpanded ? (
            <ChevronDown className="w-3.5 h-3.5" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5" />
          )}
        </button>
      </div>
    </div>
  );
}

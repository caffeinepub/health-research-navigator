import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Loader2,
  Search,
} from "lucide-react";
import { useState } from "react";
import { useActor } from "../hooks/useActor";

interface PubMedArticle {
  id: string;
  title: string;
}

interface Props {
  isOpen: boolean;
  onToggle: () => void;
  broadArea: string;
  onBroadAreaChange: (v: string) => void;
  onComplete: () => void;
}

const DB_LINKS = [
  {
    name: "Google Scholar",
    color: "#4285F4",
    url: (q: string) => `https://scholar.google.com/scholar?q=${q}`,
  },
  {
    name: "PubMed",
    color: "#336699",
    url: (q: string) => `https://pubmed.ncbi.nlm.nih.gov/?term=${q}`,
  },
  {
    name: "Scopus",
    color: "#F4820A",
    url: (q: string) => `https://www.scopus.com/results/results.uri?query=${q}`,
  },
  {
    name: "Cochrane",
    color: "#C12239",
    url: (q: string) => `https://www.cochranelibrary.com/search?q=${q}`,
  },
  {
    name: "IndMED",
    color: "#228B22",
    url: (q: string) =>
      `https://indmed.nic.in/cgi-bin/dbc.cgi?db=IndMED&op=search&query=${q}`,
  },
  {
    name: "Shodhganga",
    color: "#7B3F9E",
    url: (q: string) =>
      `https://shodhganga.inflibnet.ac.in/simple-search?query=${q}`,
  },
  {
    name: "ScienceDirect",
    color: "#E84A05",
    url: (q: string) => `https://www.sciencedirect.com/search?qs=${q}`,
  },
];

function parseIds(xml: string): string[] {
  const matches = xml.match(/<Id>(\d+)<\/Id>/g) ?? [];
  return matches.map((m) => m.replace(/<\/?Id>/g, ""));
}

function parseArticles(xml: string, ids: string[]): PubMedArticle[] {
  const titleMatches = xml.match(/<ArticleTitle>[^<]+<\/ArticleTitle>/g) ?? [];
  const pmidMatches = xml.match(/<PMID[^>]*>(\d+)<\/PMID>/g) ?? [];
  const pmids = pmidMatches.map((m) => m.replace(/<PMID[^>]*>|<\/PMID>/g, ""));
  return titleMatches.slice(0, 10).map((t, i) => ({
    id: pmids[i] ?? ids[i] ?? String(i),
    title: t.replace(/<ArticleTitle>|<\/ArticleTitle>/g, ""),
  }));
}

export function BroadAreaSection({
  isOpen,
  onToggle,
  broadArea,
  onBroadAreaChange,
  onComplete,
}: Props) {
  const { actor } = useActor();
  const [isSearching, setIsSearching] = useState(false);
  const [articles, setArticles] = useState<PubMedArticle[]>([]);
  const [searchDone, setSearchDone] = useState(false);

  const handleSearch = async () => {
    if (!broadArea.trim() || !actor) return;
    setIsSearching(true);
    setArticles([]);
    try {
      const searchXml = await actor.searchPubMed(broadArea.trim());
      const ids = parseIds(searchXml);
      if (ids.length === 0) {
        setArticles([]);
        setSearchDone(true);
        return;
      }
      const fetchXml = await actor.fetchPubMedArticles(
        ids.slice(0, 10).join(","),
      );
      const parsed = parseArticles(fetchXml, ids);
      setArticles(parsed);
      setSearchDone(true);
    } catch (e) {
      console.error(e);
      setSearchDone(true);
    } finally {
      setIsSearching(false);
    }
  };

  const encodedQuery = encodeURIComponent(broadArea.trim());

  return (
    <div className="border-b border-border last:border-0">
      {/* Header */}
      <button
        type="button"
        data-ocid="broad_area.toggle"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-8 py-5 text-left transition-colors hover:opacity-95"
        style={{
          background: isOpen ? "oklch(49% 0.11 240)" : "oklch(88% 0.06 230)",
        }}
      >
        <div className="flex items-center gap-3">
          <span
            className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold"
            style={{
              background: isOpen ? "white" : "oklch(49% 0.11 240)",
              color: isOpen ? "oklch(49% 0.11 240)" : "white",
            }}
          >
            1
          </span>
          <span
            className="font-semibold text-base"
            style={{ color: isOpen ? "white" : "oklch(28% 0.09 255)" }}
          >
            Broad Area of Research
          </span>
        </div>
        {isOpen ? (
          <ChevronDown size={20} color="white" />
        ) : (
          <ChevronRight size={20} color="oklch(35% 0.08 240)" />
        )}
      </button>

      {/* Body */}
      {isOpen && (
        <div className="px-8 py-7 space-y-6">
          <div>
            <label
              htmlFor="broad-area-input"
              className="block text-sm font-semibold mb-2"
              style={{ color: "oklch(28% 0.09 255)" }}
            >
              Describe your broad area of health research
            </label>
            <p className="text-xs text-muted-foreground mb-3">
              Be specific about the health domain, population, and context. This
              will be used to search global literature databases.
            </p>
            <Textarea
              id="broad-area-input"
              data-ocid="broad_area.textarea"
              value={broadArea}
              onChange={(e) => onBroadAreaChange(e.target.value)}
              placeholder="e.g., The impact of social determinants of health on cardiovascular disease outcomes in low-income urban populations in India..."
              className="min-h-[120px] text-sm resize-none border-border focus-visible:ring-primary"
            />
          </div>

          {/* Search PubMed */}
          <div className="flex items-center gap-3">
            <Button
              data-ocid="broad_area.primary_button"
              onClick={handleSearch}
              disabled={isSearching || !broadArea.trim() || !actor}
              className="gap-2 font-semibold"
              style={{ background: "oklch(49% 0.11 240)", color: "white" }}
            >
              {isSearching ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Searching
                  PubMed...
                </>
              ) : (
                <>
                  <Search size={16} /> Search PubMed
                </>
              )}
            </Button>
            {searchDone && articles.length > 0 && (
              <span className="text-xs text-muted-foreground">
                {articles.length} articles found
              </span>
            )}
            {searchDone && articles.length === 0 && !isSearching && (
              <span className="text-xs text-muted-foreground">
                No PubMed results found for this query.
              </span>
            )}
          </div>

          {/* PubMed results */}
          {isSearching && (
            <div
              data-ocid="broad_area.loading_state"
              className="flex items-center gap-2 text-sm text-muted-foreground"
            >
              <Loader2 size={16} className="animate-spin" />
              Querying PubMed database...
            </div>
          )}

          {articles.length > 0 && (
            <div className="rounded-lg border border-border overflow-hidden">
              <div
                className="px-4 py-2.5 border-b border-border"
                style={{ background: "oklch(95% 0.01 220)" }}
              >
                <p
                  className="text-xs font-semibold uppercase tracking-wide"
                  style={{ color: "oklch(35% 0.08 240)" }}
                >
                  PubMed Results
                </p>
              </div>
              <ul className="divide-y divide-border">
                {articles.map((art, i) => (
                  <li
                    key={art.id}
                    data-ocid={`broad_area.item.${i + 1}`}
                    className="px-4 py-2.5 hover:bg-accent/40 transition-colors"
                  >
                    <a
                      href={`https://pubmed.ncbi.nlm.nih.gov/${art.id}/`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm flex items-start gap-2 group"
                      style={{ color: "oklch(49% 0.11 240)" }}
                    >
                      <ExternalLink
                        size={13}
                        className="mt-0.5 shrink-0 opacity-60 group-hover:opacity-100"
                      />
                      <span className="group-hover:underline leading-snug">
                        {art.title}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* External DB links */}
          <div>
            <p
              className="text-xs font-semibold uppercase tracking-wide mb-3"
              style={{ color: "oklch(35% 0.08 240)" }}
            >
              Search in External Databases
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {DB_LINKS.map((db) => (
                <a
                  key={db.name}
                  href={db.url(encodedQuery)}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-ocid="broad_area.link"
                  className="flex items-center gap-2 px-3 py-2 rounded-md border border-border text-xs font-medium hover:shadow-md transition-all group"
                  style={{
                    color: db.color,
                    borderColor: `${db.color}44`,
                    background: `${db.color}0D`,
                  }}
                >
                  <ExternalLink size={12} className="shrink-0" />
                  <span>{db.name}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Next step */}
          <div className="flex justify-end pt-2">
            <Button
              data-ocid="broad_area.secondary_button"
              onClick={onComplete}
              disabled={!broadArea.trim()}
              variant="outline"
              className="gap-2 border-primary text-primary hover:bg-primary hover:text-white font-semibold"
            >
              Continue to Research Gap →
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

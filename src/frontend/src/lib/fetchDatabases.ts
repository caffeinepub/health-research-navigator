import type { Study } from "../types/study";
import {
  extractAuthorLimitations,
  extractFutureResearch,
  extractKeyFindings,
  extractResearchGaps,
  reconstructAbstract,
} from "./searchUtils";

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

// ─── CORS proxy helpers ───────────────────────────────────────────────────────
async function fetchTextViaProxy(
  url: string,
  timeoutMs = 18000,
): Promise<string> {
  const proxies = [
    `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    `https://corsproxy.io/?url=${encodeURIComponent(url)}`,
    `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
  ];
  const errors: string[] = [];
  for (const proxy of proxies) {
    try {
      const res = await fetch(proxy, {
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (!res.ok) {
        errors.push(`${proxy} HTTP ${res.status}`);
        continue;
      }
      const text = await res.text();
      if (!text || text.trim() === "") {
        errors.push(`${proxy} empty response`);
        continue;
      }
      // allorigins sometimes wraps in { "contents": "..." }
      if (text.trimStart().startsWith("{")) {
        try {
          const outer = JSON.parse(text);
          if (
            typeof outer.contents === "string" &&
            outer.contents.trim() !== ""
          ) {
            return outer.contents;
          }
        } catch {
          /* not wrapped JSON */
        }
      }
      return text;
    } catch (e: any) {
      errors.push(`${proxy}: ${e?.message || e}`);
    }
  }
  throw new Error(`All proxies failed: ${errors.join(" | ")}`);
}

async function fetchJsonViaProxy(url: string): Promise<any> {
  const text = await fetchTextViaProxy(url);
  return JSON.parse(text);
}

// ─── PubMed (via Europe PMC with source:MED filter) ───────────────────────────
// Europe PMC indexes all PubMed articles (source:MED = MEDLINE/PubMed).
// The Europe PMC REST API supports CORS natively — no proxy needed.
// This is the most reliable way to get PubMed content in a browser app.
export async function fetchPubMed(
  query: string,
  yearFrom?: string,
  yearTo?: string,
): Promise<Study[]> {
  const enc = encodeURIComponent(query);

  // Build the query with source:MED to get only PubMed-indexed articles
  const sourceFilter = encodeURIComponent(" AND SRC:MED");
  const yearFilter = yearFrom
    ? `&fromDate=${yearFrom}-01-01&toDate=${yearTo || new Date().getFullYear()}-12-31`
    : "";

  const apiUrl = `https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=${enc}${sourceFilter}&resultType=core&pageSize=500&format=json${yearFilter}`;

  let data: any = null;

  // Try direct first (Europe PMC API allows CORS)
  try {
    const res = await fetch(apiUrl, { signal: AbortSignal.timeout(20000) });
    if (res.ok) {
      data = await res.json();
    }
  } catch {
    /* fall through to proxy */
  }

  // Fallback: try without source filter (broader)
  if (!data || !data?.resultList?.result?.length) {
    try {
      const broadUrl = `https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=${enc}&resultType=core&pageSize=200&format=json${yearFilter}&synonym=TRUE`;
      const res = await fetch(broadUrl, { signal: AbortSignal.timeout(20000) });
      if (res.ok) {
        data = await res.json();
      }
    } catch {
      /* ignore */
    }
  }

  if (!data?.resultList?.result?.length) {
    throw new Error(
      "PubMed (Europe PMC): No results returned. Check your query or network.",
    );
  }

  const results = data.resultList.result || [];
  return results.map((r: any) => {
    const abstract = r.abstractText || "";
    const pmid = r.pmid || r.id || uid();
    return {
      id: `pubmed-${pmid}`,
      title: r.title || "No title",
      authors: r.authorString
        ? r.authorString.split(",").map((a: string) => a.trim())
        : [],
      journal: r.journalTitle || r.bookOrReportDetails?.publisher || "",
      year: Number.parseInt(r.pubYear || "0") || 0,
      volume: r.volume || "",
      pages: r.pageInfo || "",
      doi: r.doi || "",
      abstract,
      source: "PubMed",
      keyFindings: extractKeyFindings(abstract),
      researchGaps: extractResearchGaps(abstract),
      futureResearch: extractFutureResearch(abstract),
      authorLimitations: extractAuthorLimitations(abstract),
    };
  });
}

// ─── Semantic Scholar ─────────────────────────────────────────────────────────
// The Semantic Scholar Graph API (api.semanticscholar.org) sends
// Access-Control-Allow-Origin: * — no proxy needed.
export async function fetchSemanticScholar(
  query: string,
  yearFrom?: string,
  yearTo?: string,
): Promise<Study[]> {
  const enc = encodeURIComponent(query);
  const yearFilter = yearFrom
    ? `&year=${yearFrom}-${yearTo || new Date().getFullYear()}`
    : "";
  const apiUrl = `https://api.semanticscholar.org/graph/v1/paper/search?query=${enc}&limit=100&fields=title,authors,year,venue,abstract,externalIds${yearFilter}`;

  // Retry helper for 429 rate limits
  const tryFetch = async (attempt: number): Promise<Response | null> => {
    try {
      const res = await fetch(apiUrl, {
        signal: AbortSignal.timeout(25000),
        headers: { Accept: "application/json" },
      });
      if (res.status === 429 && attempt < 3) {
        await new Promise((r) => setTimeout(r, 2000 * attempt));
        return tryFetch(attempt + 1);
      }
      return res;
    } catch {
      return null;
    }
  };

  let data: any = null;
  const res = await tryFetch(1);
  if (res?.ok) {
    try {
      data = await res.json();
    } catch {
      /* ignore parse error */
    }
  }

  if (!data?.data?.length) {
    // One final attempt via proxy as last resort
    try {
      data = await fetchJsonViaProxy(apiUrl);
    } catch {
      console.warn("Semantic Scholar: all methods failed");
      return [];
    }
  }

  const papers = data?.data || [];
  return papers.map((p: any) => {
    const abstract = p.abstract || "";
    return {
      id: `ss-${p.paperId || uid()}`,
      title: p.title || "No title",
      authors: (p.authors || []).map((a: { name: string }) => a.name),
      journal: p.venue || "",
      year: p.year || 0,
      doi: p.externalIds?.DOI || "",
      abstract,
      source: "Semantic Scholar",
      keyFindings: extractKeyFindings(abstract),
      researchGaps: extractResearchGaps(abstract),
      futureResearch: extractFutureResearch(abstract),
      authorLimitations: extractAuthorLimitations(abstract),
    };
  });
}

// ─── OpenAlex ─────────────────────────────────────────────────────────────────
export async function fetchOpenAlex(
  query: string,
  yearFrom?: string,
  yearTo?: string,
): Promise<Study[]> {
  const enc = encodeURIComponent(query);
  const yearFilterPart = yearFrom
    ? `,publication_year:${yearFrom}-${yearTo || new Date().getFullYear()}`
    : "";
  const filterParam = yearFilterPart
    ? `&filter=is_oa:true${yearFilterPart}`
    : "";
  const res = await fetch(
    `https://api.openalex.org/works?search=${enc}&per-page=200${filterParam}&select=id,title,authorships,publication_year,primary_location,abstract_inverted_index,doi,biblio`,
    { signal: AbortSignal.timeout(18000) },
  );
  if (!res.ok) throw new Error(`OpenAlex HTTP ${res.status}`);
  const data = await res.json();
  const works = data?.results || [];
  return works.map((w: any) => {
    const abstract = reconstructAbstract(w.abstract_inverted_index);
    const authors = (w.authorships || [])
      .map((a: any) => a?.author?.display_name)
      .filter(Boolean);
    const journalName =
      w.primary_location?.source?.display_name ||
      w.primary_location?.display_name ||
      "";
    return {
      id: `oa-${uid()}`,
      title: w.title || "No title",
      authors,
      journal: journalName,
      year: w.publication_year || 0,
      volume: w.biblio?.volume || "",
      pages: w.biblio?.first_page
        ? `${w.biblio.first_page}${w.biblio.last_page ? `-${w.biblio.last_page}` : ""}`
        : "",
      doi: w.doi?.replace("https://doi.org/", "") || "",
      abstract,
      source: "OpenAlex",
      keyFindings: extractKeyFindings(abstract),
      researchGaps: extractResearchGaps(abstract),
      futureResearch: extractFutureResearch(abstract),
      authorLimitations: extractAuthorLimitations(abstract),
    };
  });
}

// ─── Europe PMC ───────────────────────────────────────────────────────────────
export async function fetchEuropePMC(
  query: string,
  yearFrom?: string,
  yearTo?: string,
): Promise<Study[]> {
  const enc = encodeURIComponent(query);
  const yearFilter = yearFrom
    ? `&fromDate=${yearFrom}-01-01&toDate=${yearTo || new Date().getFullYear()}-12-31`
    : "";
  const res = await fetch(
    `https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=${enc}&resultType=core&pageSize=500&format=json${yearFilter}`,
    { signal: AbortSignal.timeout(18000) },
  );
  const data = await res.json();
  const results = data?.resultList?.result || [];
  return results.map((r: any) => {
    const abstract = r.abstractText || "";
    return {
      id: `epmc-${r.id || uid()}`,
      title: r.title || "No title",
      authors: r.authorString
        ? r.authorString.split(",").map((a: string) => a.trim())
        : [],
      journal: r.journalTitle || "",
      year: Number.parseInt(r.pubYear || "0") || 0,
      volume: r.volume || "",
      pages: r.pageInfo || "",
      doi: r.doi || "",
      abstract,
      source: "Europe PMC",
      keyFindings: extractKeyFindings(abstract),
      researchGaps: extractResearchGaps(abstract),
      futureResearch: extractFutureResearch(abstract),
      authorLimitations: extractAuthorLimitations(abstract),
    };
  });
}

// ─── ArXiv ────────────────────────────────────────────────────────────────────
export async function fetchArXiv(
  query: string,
  yearFrom?: string,
  yearTo?: string,
): Promise<Study[]> {
  const apiUrl = `https://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(query)}&start=0&max_results=200`;

  let xmlText = "";
  try {
    const res = await fetch(apiUrl, { signal: AbortSignal.timeout(15000) });
    if (res.ok) {
      const t = await res.text();
      if (t?.includes("<entry>")) xmlText = t;
    }
  } catch {
    /* fall through to proxy */
  }

  if (!xmlText) {
    try {
      const text = await fetchTextViaProxy(apiUrl);
      if (text?.includes("<entry>")) xmlText = text;
    } catch (e) {
      throw new Error(`ArXiv: all methods failed: ${(e as Error).message}`);
    }
  }

  if (!xmlText) throw new Error("ArXiv: no valid XML received");

  const parser = new DOMParser();
  const xml = parser.parseFromString(xmlText, "application/xml");
  if (xml.querySelector("parsererror"))
    throw new Error("ArXiv: failed to parse XML");

  const entries = Array.from(xml.querySelectorAll("entry"));
  if (entries.length === 0) return [];

  const fromYear = yearFrom ? Number.parseInt(yearFrom) : null;
  const toYear = yearTo ? Number.parseInt(yearTo) : null;

  const mapped = entries.map((entry) => {
    const title =
      entry.querySelector("title")?.textContent?.trim().replace(/\s+/g, " ") ||
      "No title";
    const authors = Array.from(entry.querySelectorAll("author name")).map(
      (n) => n.textContent?.trim() || "",
    );
    const abstract =
      entry
        .querySelector("summary")
        ?.textContent?.trim()
        .replace(/\s+/g, " ") || "";
    const published = entry.querySelector("published")?.textContent || "";
    const year = Number.parseInt(published.slice(0, 4)) || 0;

    if (fromYear && year < fromYear) return null;
    if (toYear && year > toYear) return null;

    const idUrl = entry.querySelector("id")?.textContent?.trim() || "";
    const arxivId = idUrl.replace(/.*\/abs\//, "").replace(/v\d+$/, "");
    return {
      id: `arxiv-${uid()}`,
      title,
      authors,
      journal: "arXiv preprint",
      year,
      doi: arxivId ? `arXiv:${arxivId}` : idUrl,
      abstract,
      source: "ArXiv",
      keyFindings: extractKeyFindings(abstract),
      researchGaps: extractResearchGaps(abstract),
      futureResearch: extractFutureResearch(abstract),
      authorLimitations: extractAuthorLimitations(abstract),
    };
  });

  return mapped.filter(Boolean) as Study[];
}

// ─── ERIC ─────────────────────────────────────────────────────────────────────
export async function fetchERIC(
  query: string,
  _yearFrom?: string,
  _yearTo?: string,
): Promise<Study[]> {
  const enc = encodeURIComponent(query);
  const res = await fetch(
    `https://api.ies.ed.gov/eric/?search=${enc}&fields=title,author,publicationdateyear,description,issn,source,peerreviewed&rows=200&format=json`,
    { signal: AbortSignal.timeout(18000) },
  );
  const data = await res.json();
  const docs = data?.response?.docs || [];
  return docs.map((d: any) => {
    const abstract = d.description || "";
    return {
      id: `eric-${uid()}`,
      title: d.title || "No title",
      authors: d.author
        ? Array.isArray(d.author)
          ? d.author
          : [d.author]
        : [],
      journal: d.source || "",
      year: Number.parseInt(d.publicationdateyear || "0") || 0,
      abstract,
      source: "ERIC",
      keyFindings: extractKeyFindings(abstract),
      researchGaps: extractResearchGaps(abstract),
      futureResearch: extractFutureResearch(abstract),
      authorLimitations: extractAuthorLimitations(abstract),
    };
  });
}

// ─── Google Scholar (via CrossRef) ────────────────────────────────────────────
export async function fetchGoogleScholar(
  query: string,
  yearFrom?: string,
  yearTo?: string,
): Promise<Study[]> {
  const enc = encodeURIComponent(query);
  const yearFilter = yearFrom
    ? `&filter=from-pub-date:${yearFrom},until-pub-date:${yearTo || new Date().getFullYear()}`
    : "";
  const res = await fetch(
    `https://api.crossref.org/works?query=${enc}&rows=200&select=DOI,title,author,published,container-title,volume,page,abstract${yearFilter}`,
    { signal: AbortSignal.timeout(18000) },
  );
  if (!res.ok) throw new Error(`CrossRef HTTP ${res.status}`);
  const data = await res.json();
  const items = data?.message?.items || [];
  return items.map((item: any) => {
    const authors = (item.author || [])
      .map((a: any) =>
        `${a.family || ""}${a.given ? `, ${a.given}` : ""}`.trim(),
      )
      .filter(Boolean);
    const year = item.published?.["date-parts"]?.[0]?.[0] || 0;
    const rawAbstract = item.abstract || "";
    const abstract = rawAbstract.replace(/<[^>]*>/g, "").trim();
    const containerTitle = item["container-title"];
    const journal = Array.isArray(containerTitle)
      ? containerTitle[0] || ""
      : containerTitle || "";
    const titleVal = item.title;
    const title = Array.isArray(titleVal)
      ? titleVal[0] || "No title"
      : titleVal || "No title";
    return {
      id: `gs-${uid()}`,
      title,
      authors,
      journal,
      year,
      volume: item.volume || "",
      pages: item.page || "",
      doi: item.DOI || "",
      abstract,
      source: "Google Scholar (via CrossRef)",
      keyFindings: extractKeyFindings(abstract),
      researchGaps: extractResearchGaps(abstract),
      futureResearch: extractFutureResearch(abstract),
      authorLimitations: extractAuthorLimitations(abstract),
    };
  });
}

// ─── Shodhganga / Indian Theses (via CrossRef) ────────────────────────────────
export async function fetchShodhganga(
  query: string,
  yearFrom?: string,
  yearTo?: string,
): Promise<Study[]> {
  const enc = encodeURIComponent(query);
  const yearFilterPart = yearFrom
    ? `,from-pub-date:${yearFrom},until-pub-date:${yearTo || new Date().getFullYear()}`
    : "";
  const res = await fetch(
    `https://api.crossref.org/works?query=${enc}&rows=200&filter=type:dissertation${yearFilterPart}&select=DOI,title,author,published,container-title,publisher,abstract`,
    { signal: AbortSignal.timeout(18000) },
  );
  if (!res.ok) throw new Error(`Shodhganga/CrossRef HTTP ${res.status}`);
  const data = await res.json();
  const items = data?.message?.items || [];
  return items.map((item: any) => {
    const authors = (item.author || [])
      .map((a: any) =>
        `${a.family || ""}${a.given ? `, ${a.given}` : ""}`.trim(),
      )
      .filter(Boolean);
    const year = item.published?.["date-parts"]?.[0]?.[0] || 0;
    const rawAbstract = item.abstract || "";
    const abstract = rawAbstract.replace(/<[^>]*>/g, "").trim();
    const containerTitle = item["container-title"];
    const journalFallback = Array.isArray(containerTitle)
      ? containerTitle[0] || ""
      : containerTitle || "";
    const titleVal = item.title;
    const title = Array.isArray(titleVal)
      ? titleVal[0] || "No title"
      : titleVal || "No title";
    return {
      id: `sg-${uid()}`,
      title,
      authors,
      journal: item.publisher || journalFallback,
      year,
      doi: item.DOI || "",
      abstract,
      source: "Shodhganga / Indian Theses",
      keyFindings: extractKeyFindings(abstract),
      researchGaps: extractResearchGaps(abstract),
      futureResearch: extractFutureResearch(abstract),
      authorLimitations: extractAuthorLimitations(abstract),
    };
  });
}

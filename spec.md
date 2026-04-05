# Health Research Navigator

## Current State
The app has 8 in-app database searches. PubMed search is broken — the esearch step works but the efetch XML step fails due to CORS blocks on all proxy chains when the URL becomes large with many IDs. Semantic Scholar search is also unreliable due to CORS proxy instability. Both databases are critical for health research.

## Requested Changes (Diff)

### Add
- A dedicated `fetchPubMedViaEuropePMC` function that queries Europe PMC with `source:MED` filter — this returns PubMed-indexed articles through Europe PMC's CORS-friendly API, getting the same literature without any proxy needed
- Fallback: if Europe PMC source:MED returns 0 results, fall back to direct PubMed efetch with small batches
- A note in the PubMed results panel: "Results sourced from PubMed index via Europe PMC" to be transparent

### Modify
- `fetchPubMed` in `fetchDatabases.ts`: replace the esearch+efetch XML approach with a Europe PMC `source:MED` query; keep all extracted fields (title, authors, journal, year, abstract, doi, volume, pages)
- `fetchSemanticScholar`: remove proxy fallback (Semantic Scholar API supports CORS natively at `api.semanticscholar.org`); add proper retry on 429; increase limit to 100 results
- The PubMed section label in the UI to show "PubMed (via NCBI Index)" so the user sees it clearly

### Remove
- The broken esearch → efetch XML → proxy chain for PubMed
- Proxy fallback for Semantic Scholar (not needed, causes failures)

## Implementation Plan
1. Rewrite `fetchPubMed` to use Europe PMC with `query=${enc}&filter=source:MED` — returns PubMed-indexed articles with full metadata and abstracts, no CORS issues
2. Add `&pageSize=500` to get maximum results (respects user's request for no limits)
3. Map Europe PMC response fields to Study type (same fields already used by `fetchEuropePMC`)
4. Fix `fetchSemanticScholar` — remove proxy fallback, use direct API only with 3-retry on 429
5. Update display label for PubMed results to clarify sourcing

# Health Research Navigator

## Current State
The app searches 8 databases in-app: PubMed (via Europe PMC SRC:MED), Semantic Scholar, OpenAlex, Europe PMC, ArXiv, ERIC, Google Scholar (via CrossRef), and Shodhganga (via CrossRef). All results are deduplicated by DOI then normalized title before evidence synthesis. The `SearchResults` and `DatabaseStatus` types enumerate all 8 database keys.

## Requested Changes (Diff)

### Add
- **Consensus database** (consensus.app) added to the search pipeline as the 9th database.
- Since Consensus.app has no public API, it will be searched via the Semantic Scholar API with a `fieldsOfStudy=Medicine` filter and higher result count — the same underlying academic papers Consensus surfaces. A direct link to `https://consensus.app/results/?q=<encoded_query>` is included in the result panel header so users can also open the Consensus site directly with their query pre-filled.
- `fetchConsensus()` function added to `fetchDatabases.ts`.
- `consensus` key added to `SearchResults`, `DatabaseStatus`, and `DatabaseName` types in `study.ts`.
- `consensus` entry added to `DB_META` in `App.tsx`.
- `consensus` added to `EMPTY_RESULTS` and `IDLE_STATUS` constants.
- `consensus` added to the `setDbStatus` call at search start and to the `fetchers` array.
- `SOURCE_PRIORITY` in `searchUtils.ts` updated to include `consensus`.

### Modify
- Deduplication logic remains unchanged — Consensus results are merged into the same DOI/title-based dedup pool as all other databases.

### Remove
- Nothing removed.

## Implementation Plan
1. Update `src/frontend/src/types/study.ts` to add `consensus` to `DatabaseName`, `SearchResults`, and `DatabaseStatus`.
2. Add `fetchConsensus()` to `src/frontend/src/lib/fetchDatabases.ts` — uses Semantic Scholar API with `fieldsOfStudy=Medicine` and up to 100 results, maps to Study objects with `source: "Consensus"`.
3. Update `src/frontend/src/lib/searchUtils.ts` — add `"consensus"` to `SOURCE_PRIORITY`.
4. Update `src/frontend/src/App.tsx`:
   - Add `consensus` import from fetchDatabases
   - Add `consensus` to `DB_META`
   - Add `consensus` to `EMPTY_RESULTS` and `IDLE_STATUS`
   - Add `consensus` to `setDbStatus` at search start
   - Add `["consensus", fetchConsensus(...)]` to `fetchers` array
5. Validate and build.

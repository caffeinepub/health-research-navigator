# Health Research Navigator

## Current State
The app has a year-of-publication filter toggle below the search box. Search results from all 12 databases are deduplicated. There is no study type filter yet.

## Requested Changes (Diff)

### Add
- Study type filter toggle (below or alongside the year filter) with the following options:
  - All Study Types (default)
  - Randomized Controlled Trial (RCT)
  - Systematic Review
  - Meta-Analysis
  - Observational Study
  - Cohort Study
  - Case-Control Study
  - Cross-Sectional Study
  - Clinical Trial
  - Qualitative Study
  - Case Report / Case Series
  - Review Article
  - Guideline / Consensus Statement
  - Dissertation / Thesis
- Selected study type shows as a badge on the collapsed toggle
- When a study type other than "All" is selected, filter the deduplicated results client-side by matching keywords in the title, abstract, or journal field
- "All Study Types" option ensures no filtering is applied and all studies are shown

### Modify
- The deduplicated results list should be further filtered by the selected study type before being passed to the results display and evidence synthesis
- The deduplication stats banner should reflect the filtered count when a study type filter is active

### Remove
- Nothing removed

## Implementation Plan
1. Add `studyTypeFilter` state (string, default "All")
2. Add `studyTypeFilterOpen` boolean state
3. Add the study type filter toggle UI below the year filter, matching the same style
4. Define a `STUDY_TYPES` constant array with all options including "All Study Types"
5. Add a `filterByStudyType(studies, studyType)` function that checks title + abstract + journal for study-type keywords
6. Apply the filter after deduplication: `const filteredStudies = filterByStudyType(deduplicatedStudies, studyTypeFilter)`
7. Use `filteredStudies` everywhere `deduplicatedStudies` was used for display, synthesis, and stats
8. Show active filter badge on the toggle header

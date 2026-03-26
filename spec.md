# Health Research Navigator

## Current State
- Step 1: Broad Area of Research (PubMed search + external DB links)
- Step 2: Research Gap (4 fields: known, contested, missing, proposed gap + save session)
- Saved Sessions panel

## Requested Changes (Diff)

### Add
- Step 3: Framework Classifier — after search/gap, user selects which framework (PICO, PICOS, PECO, SPIDER, ECLIPSE) best fits their study. App shows framework fields based on selection and lets user fill them in. Auto-suggests the best framework based on study type (intervention → PICO/PICOS, exposure → PECO, qualitative → SPIDER, health services → ECLIPSE).
- Step 4: Study Limitations + PDF Export — user inputs or auto-generates study limitations relevant to their framework/design. A "Download PDF" button generates a well-formatted PDF containing: research topic, framework classification with filled fields, research gap statement, and study limitations.

### Modify
- App.tsx: add state and toggle logic for Step 3 and Step 4, unlock Step 3 after Step 2 is completed (proposed gap filled), unlock Step 4 after Step 3 is filled.

### Remove
- Nothing removed.

## Implementation Plan
1. Create `FrameworkSection.tsx` — Step 3 component with framework selector cards (PICO/PICOS/PECO/SPIDER/ECLIPSE) and dynamic fields per framework. Include auto-suggest logic.
2. Create `LimitationsPdfSection.tsx` — Step 4 component with limitations textarea and PDF export using jsPDF (already available or use browser print-to-PDF approach via a printable HTML blob).
3. Update `App.tsx` to add Steps 3 and 4 with proper unlock logic.
4. Pass broadArea, proposedGap, frameworkData to Step 4 for PDF generation.

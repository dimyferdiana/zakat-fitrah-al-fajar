## Plan: PRD + tasks for Sedekah receipt PDF

Draft a PRD for phase 2.2.0 covering a Sedekah receipt generator (PDF only, profiles saved/reused), then produce a parent-task list per the task-generation rules and pause for “Go” before sub-tasks.

### Steps
1. Confirm scope/details (template fields, branding, profile source) needed to draft PRD in tasks/prd-phase-2.2.0-sedekah-receipt.md.
2. Write PRD sections (goals, user stories, functional/non-goals, success metrics) in tasks/prd-phase-2.2.0-sedekah-receipt.md.
3. Draft parent tasks per workflow (include 0.0 branch) in tasks/tasks-phase-2.2.0-sedekah-receipt.md and pause for “Go”.
4. After “Go”, expand sub-tasks and relevant files in tasks/tasks-phase-2.2.0-sedekah-receipt.md.

### Further Considerations
1. Receipt template content? A) Minimal (donor, amount, date) B) Add staff/signature C) Add payment method/reference.
2. Branding? A) Use existing “Masjid Al-Fajar” header style B) Custom logo/text upload per receipt C) No branding.
3. Profile source/lookup? A) Search existing muzakki table by name/phone B) Separate donor store C) Manual entry only.
4. PDF generation style? A) Reuse existing jsPDF header/footer pattern B) New layout with placeholders C) Match zakat receipt modal UX.

# AGENTS.md (Noe Shiftica — project-specific)
# Universal rules (Startup Protocol / HARD STOP / Post-Edit Self-Check) live in global ~/.gemini/AGENTS.md.
# This file contains project-specific overrides only.

## Files to ALWAYS read at startup
.antigravity/notouch.md / .antigravity/potential-risks.md / .antigravity/bug-history.md / .antigravity/sessions.md

## Protected files (editing requires explicit approval — HARD STOP)
- src/collections/*
- src/payload.config.ts
- src/access/*
- src/lib/db.ts
- components/Footer.tsx

## DB / Storage Sanctuary
Destructive operations on the production DB / Storage are forbidden.
Strictly follow the pre-deploy backup-branch workflow.
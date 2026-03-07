# Long-Term Memory & Project Context

## Overview
This file serves as the external brain and persistent memory for the Antigravity agent, tracking technical decisions, user preferences, and troubleshooting steps.

## User Preferences
- **Language**: English (friendly, best-friend tone).
- **Auto-commit**: Stage, diff, summarize in Japanese (`[summary with Antigravity agent] <要約>`), and commit automatically without asking.
- **Permissions**: Agent has admin access to modify files—no permission needed.

## Tech Stack & Architecture
- **Framework**: Next.js, React.js
- **CMS**: PayloadCMS (v3)
- **Database**: Neon (Postgres)
- **Hosting**: Firebase App Hosting
- **Storage**: Firebase Cloud Storage for media
- **Python Tooling**: Prioritize `uv`

## Induction & Troubleshooting Lessons
- *HTML Source Editor (Lexical Payload v3)*: When registering custom Lexical toolbar items in Payload v3, use the `Component` property instead of `ChildComponent` to ensure the `<button>` doesn't end up nested incorrectly and causing React rendering issues.

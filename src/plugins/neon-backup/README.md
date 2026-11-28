# Neon Database Backup Plugin

A custom Payload CMS plugin that provides real-time automated backups for Neon Serverless Postgres databases by utilizing Neon's instant branching feature.

## Key Features
- **Change-Triggered Automatic Backups**: Listens to `afterChange` hooks (create/update operations) on specified collection(s).
- **Instant Branching Backups**: Spawns a new branch named `backup/on-save-YYYYMMDD-HHmmss` (JST) directly from the current primary (production) branch via the Neon API.
- **3 backups kept in total**: Only after the new branch is created successfully, every backup branch (any name starting with `backup/` or `backup-`: on-save, pre-deploy and hand-made pre-migration ones) beyond the newest 3 is deleted. Production, the default branch and other branches are never touched. If creation fails (e.g. the Free plan's 10-branch limit), nothing is deleted. (Azuma's decision 2026-11-28: the newest 3 are enough.)
- **30-Minute Throttle**: Skips the backup when the newest `backup/on-save*` branch is less than 30 minutes old, so repeated saves while editing do not push out the older generation. The check reads the branch list from Neon, so it works across server instances.
- **Non-Blocking Execution**: Triggers asynchronously as a fire-and-forget operation, ensuring that content authors do not experience any delay or blocking when saving documents.
- **Fail-Safe Warnings**: Logs error details or safely skips execution if credentials or target branches are missing.

## Setup Requirements
- Requires **Neon Serverless Postgres** as the database layer.
- Requires the following environment variables:
  - `NEON_API_TOKEN`: A valid personal API token for the Neon Console.
  - `NEON_PROJECT_ID`: The unique project identifier of the database project.

## Pre-deploy backups (GitHub Actions)
`.github/workflows/neon-backup.yml` runs on every push to `main` with the same rules: it creates
`backup/pre-deploy-YYYYMMDD-HHMMSS` (JST) from production, then keeps the newest 3 backup branches of
every kind and deletes the rest. On-save, pre-deploy and hand-made backups share the same count, so at most
3 backup branches exist (briefly 4 right after a new one is created). A hand-made pre-migration backup is
pushed out after three newer backups, so take the migration soon after creating it.

# Neon Database Backup Plugin

A custom Payload CMS plugin that provides real-time automated backups for Neon Serverless Postgres databases by utilizing Neon's instant branching feature.

## Key Features
- **Change-Triggered Automatic Backups**: Listens to `afterChange` hooks (create/update operations) on specified collection(s).
- **Instant Branching Backups**: Automatically deletes the old backup branch and spawns a new one named `backup/pre-deploy` branched directly from the current primary (production) branch via the Neon API.
- **Non-Blocking Execution**: Triggers asynchronously as a fire-and-forget operation, ensuring that content authors do not experience any delay or blocking when saving documents.
- **Fail-Safe Warnings**: Logs error details or safely skips execution if credentials or target branches are missing.

## Setup Requirements
- Requires **Neon Serverless Postgres** as the database layer.
- Requires the following environment variables:
  - `NEON_API_TOKEN`: A valid personal API token for the Neon Console.
  - `NEON_PROJECT_ID`: The unique project identifier of the database project.

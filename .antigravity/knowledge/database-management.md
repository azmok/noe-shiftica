# Database Management & Environment Alignment

## Environment Configuration
- **Local Development**: Connects directly to the **Production** database.
  - Connection String: `DATABASE_URL` in `.env.local` must match the production database endpoint (`ep-shy-silence-a1mbjeqg`).
- **Production (Firebase App Hosting)**: Connects to the same database endpoint (`ep-shy-silence-a1mbjeqg`).
- **Rationale**: The user requires local and production environments to be perfectly synced.

## Backup & Safety Mechanism
- **Automated Branching**: A backup branch is automatically created in Neon before every deployment.
  - **Trigger**: Push to the `main` branch.
  - **Workflow**: `.github/workflows/neon-backup.yml`.
  - **Branch Name**: `backup/pre-deploy`.
  - **Purpose**: Acts as a safety net/backup of the production data before new code is deployed.

## Important Notes
- **Modification Risk**: Since local and production share the same DB, any data modification in local development will immediately affect the live production site. Always ensure the `backup/pre-deploy` branch is healthy or manually create a Neon branch if making destructive changes.

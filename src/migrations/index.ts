import * as migration_20260226_111056_initial_setup from './20260226_111056_initial_setup';
import * as migration_20260304_050000_add_posts_drafts from './20260304_050000_add_posts_drafts';
import * as migration_20260307_171744_sync_local_to_prod_schema from './20260307_171744_sync_local_to_prod_schema';

export const migrations = [
  {
    up: migration_20260226_111056_initial_setup.up,
    down: migration_20260226_111056_initial_setup.down,
    name: '20260226_111056_initial_setup',
  },
  {
    up: migration_20260304_050000_add_posts_drafts.up,
    down: migration_20260304_050000_add_posts_drafts.down,
    name: '20260304_050000_add_posts_drafts',
  },
  {
    up: migration_20260307_171744_sync_local_to_prod_schema.up,
    down: migration_20260307_171744_sync_local_to_prod_schema.down,
    name: '20260307_171744_sync_local_to_prod_schema'
  },
];

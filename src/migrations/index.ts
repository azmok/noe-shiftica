import * as migration_20260226_111056_initial_setup from './20260226_111056_initial_setup';
import * as migration_20260304_050000_add_posts_drafts from './20260304_050000_add_posts_drafts';
import * as migration_20260307_171744_sync_local_to_prod_schema from './20260307_171744_sync_local_to_prod_schema';
import * as migration_20260310_145217_add_customMetaData_field from './20260310_145217_add_customMetaData_field';
import * as migration_20260310_153133_add_description_field from './20260310_153133_add_description_field';

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
    name: '20260307_171744_sync_local_to_prod_schema',
  },
  {
    up: migration_20260310_145217_add_customMetaData_field.up,
    down: migration_20260310_145217_add_customMetaData_field.down,
    name: '20260310_145217_add_customMetaData_field',
  },
  {
    up: migration_20260310_153133_add_description_field.up,
    down: migration_20260310_153133_add_description_field.down,
    name: '20260310_153133_add_description_field'
  },
];

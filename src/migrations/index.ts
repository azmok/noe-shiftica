import * as migration_20260226_111056_initial_setup from './20260226_111056_initial_setup';

export const migrations = [
  {
    up: migration_20260226_111056_initial_setup.up,
    down: migration_20260226_111056_initial_setup.down,
    name: '20260226_111056_initial_setup'
  },
];

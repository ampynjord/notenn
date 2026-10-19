import * as migration_20261019_095728_initial from './20261019_095728_initial';
import * as migration_20261019_130953_tunes_and_locales from './20261019_130953_tunes_and_locales';
import * as migration_20261019_131000_seed_tunes from './20261019_131000_seed_tunes';
import * as migration_20261019_182929_accounts_library from './20261019_182929_accounts_library';

export const migrations = [
  {
    up: migration_20261019_095728_initial.up,
    down: migration_20261019_095728_initial.down,
    name: '20261019_095728_initial',
  },
  {
    up: migration_20261019_130953_tunes_and_locales.up,
    down: migration_20261019_130953_tunes_and_locales.down,
    name: '20261019_130953_tunes_and_locales',
  },
  {
    up: migration_20261019_131000_seed_tunes.up,
    down: migration_20261019_131000_seed_tunes.down,
    name: '20261019_131000_seed_tunes',
  },
  {
    up: migration_20261019_182929_accounts_library.up,
    down: migration_20261019_182929_accounts_library.down,
    name: '20261019_182929_accounts_library'
  },
];

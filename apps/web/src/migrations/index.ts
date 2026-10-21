import * as migration_20261019_095728_initial from './20261019_095728_initial';
import * as migration_20261019_130953_tunes_and_locales from './20261019_130953_tunes_and_locales';
import * as migration_20261019_131000_seed_tunes from './20261019_131000_seed_tunes';
import * as migration_20261019_182929_accounts_library from './20261019_182929_accounts_library';
import * as migration_20261021_090000_tunes_texts from './20261021_090000_tunes_texts';
import * as migration_20261021_100000_roles_and_drafts from './20261021_100000_roles_and_drafts';
import * as migration_20261021_110000_breton_drafts from './20261021_110000_breton_drafts';
import * as migration_20261021_120000_remove_butterfly from './20261021_120000_remove_butterfly';

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
    name: '20261019_182929_accounts_library',
  },
  {
    up: migration_20261021_090000_tunes_texts.up,
    down: migration_20261021_090000_tunes_texts.down,
    name: '20261021_090000_tunes_texts',
  },
  {
    up: migration_20261021_100000_roles_and_drafts.up,
    down: migration_20261021_100000_roles_and_drafts.down,
    name: '20261021_100000_roles_and_drafts',
  },
  {
    up: migration_20261021_110000_breton_drafts.up,
    down: migration_20261021_110000_breton_drafts.down,
    name: '20261021_110000_breton_drafts',
  },
  {
    up: migration_20261021_120000_remove_butterfly.up,
    down: migration_20261021_120000_remove_butterfly.down,
    name: '20261021_120000_remove_butterfly',
  },
];

import * as migration_20260622_115128 from './20260622_115128';
import * as migration_20260622_172112 from './20260622_172112';

export const migrations = [
  {
    up: migration_20260622_115128.up,
    down: migration_20260622_115128.down,
    name: '20260622_115128',
  },
  {
    up: migration_20260622_172112.up,
    down: migration_20260622_172112.down,
    name: '20260622_172112'
  },
];

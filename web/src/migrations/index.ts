import * as migration_20260622_115128 from './20260622_115128';
import * as migration_20260622_172112 from './20260622_172112';
import * as migration_20260622_195408 from './20260622_195408';
import * as migration_20260623_140155_add_account_activated_and_optional_name from './20260623_140155_add_account_activated_and_optional_name';
import * as migration_20260623_153759_add_media_owner from './20260623_153759_add_media_owner';
import * as migration_20260623_160000_activate_existing_users from './20260623_160000_activate_existing_users';
import * as migration_20260623_161201_add_user_deactivated from './20260623_161201_add_user_deactivated';

export const migrations = [
  {
    up: migration_20260622_115128.up,
    down: migration_20260622_115128.down,
    name: '20260622_115128',
  },
  {
    up: migration_20260622_172112.up,
    down: migration_20260622_172112.down,
    name: '20260622_172112',
  },
  {
    up: migration_20260622_195408.up,
    down: migration_20260622_195408.down,
    name: '20260622_195408',
  },
  {
    up: migration_20260623_140155_add_account_activated_and_optional_name.up,
    down: migration_20260623_140155_add_account_activated_and_optional_name.down,
    name: '20260623_140155_add_account_activated_and_optional_name',
  },
  {
    up: migration_20260623_153759_add_media_owner.up,
    down: migration_20260623_153759_add_media_owner.down,
    name: '20260623_153759_add_media_owner',
  },
  {
    up: migration_20260623_160000_activate_existing_users.up,
    down: migration_20260623_160000_activate_existing_users.down,
    name: '20260623_160000_activate_existing_users',
  },
  {
    up: migration_20260623_161201_add_user_deactivated.up,
    down: migration_20260623_161201_add_user_deactivated.down,
    name: '20260623_161201_add_user_deactivated'
  },
];

import { describe, expect, it } from 'vitest';

import {
  BOOTSTRAP_ADMIN_UID,
  ensureBootstrapAdminProfile,
  isBootstrapAdminUid,
} from './userProfileClient.js';

describe('bootstrap admin boundary', () => {
  it('recognizes only the configured initial admin uid', () => {
    expect(BOOTSTRAP_ADMIN_UID).toBe('gEmUAqisGwU78iVSk3jIEH49uF13');
    expect(isBootstrapAdminUid(BOOTSTRAP_ADMIN_UID)).toBe(true);
    expect(isBootstrapAdminUid('different-user')).toBe(false);
  });

  it('rejects bootstrap provisioning for any other uid before touching Firestore', async () => {
    await expect(ensureBootstrapAdminProfile('different-user')).rejects.toThrow(
      'Bootstrap admin provisioning is not allowed for this Firebase uid.',
    );
  });
});

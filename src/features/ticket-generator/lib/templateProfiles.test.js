import { describe, expect, it } from 'vitest';

import {
  MANDAU_DEFAULT_PROFILE,
  TEMPLATE_PROFILE_IDS,
  getTemplateProfile,
  requireTemplateProfile,
} from './templateProfiles.js';

describe('Template Profile foundation', () => {
  it('locks the MANDAU operational timezone and email Dispatch Time source', () => {
    expect(MANDAU_DEFAULT_PROFILE).toMatchObject({
      id: 'MANDAU_DEFAULT',
      timezone: 'Asia/Jakarta',
      emailImport: {
        dispatchTimeSource: 'message_sent_time',
        sentTimeProperty: 'PR_CLIENT_SUBMIT_TIME',
        sentTimePropertyTag: '0x00390040',
        allowDeliveryTimeFallback: false,
        allowQuotedSentBodyFallback: false,
      },
    });
  });

  it('owns the reusable Progress snippet collection at the profile boundary', () => {
    expect(MANDAU_DEFAULT_PROFILE.snippetCollection).toHaveLength(9);
    expect(MANDAU_DEFAULT_PROFILE.snippetCollection.map((snippet) => snippet.category)).toEqual([
      'Dispatch',
      'Arrival',
      'Investigation',
      'OTDR',
      'Material',
      'Jointing',
      'Monitoring',
      'Clearance',
      'Escalation',
    ]);
  });

  it('returns the default profile and rejects unknown required profiles', () => {
    expect(getTemplateProfile()).toBe(MANDAU_DEFAULT_PROFILE);
    expect(getTemplateProfile(TEMPLATE_PROFILE_IDS.MANDAU_DEFAULT)).toBe(MANDAU_DEFAULT_PROFILE);
    expect(getTemplateProfile('UNKNOWN')).toBeNull();
    expect(() => requireTemplateProfile('UNKNOWN')).toThrow('Unknown Template Profile');
  });
});

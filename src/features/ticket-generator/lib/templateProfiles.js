export const TEMPLATE_PROFILE_IDS = Object.freeze({
  MANDAU_DEFAULT: 'MANDAU_DEFAULT',
});

export const MANDAU_DEFAULT_PROFILE = Object.freeze({
  id: TEMPLATE_PROFILE_IDS.MANDAU_DEFAULT,
  displayName: 'MANDAU Default',
  timezone: 'Asia/Jakarta',
  title: Object.freeze({
    prefix: '[MANDAU]',
    pathSeparator: ' <> ',
    ttLabel: 'TT',
    transportJoiner: ' AT ',
    conditionLabels: Object.freeze({
      LINK_DOWN: 'LINK DOWN',
      ETH_LOS: 'ETH LOS',
      MUT_LOS: 'MUT LOS',
    }),
  }),
  reportSections: Object.freeze([
    'title',
    'impactList',
    'occurAt',
    'dispatchAt',
    'pic',
    'rootcause',
    'cutPoint',
    'progress',
  ]),
  emailImport: Object.freeze({
    dispatchTimeSource: 'message_sent_time',
    sentTimeProperty: 'PR_CLIENT_SUBMIT_TIME',
    sentTimePropertyTag: '0x00390040',
    deliveryTimeProperty: 'PR_MESSAGE_DELIVERY_TIME',
    deliveryTimePropertyTag: '0x0E060040',
    allowDeliveryTimeFallback: false,
    allowQuotedSentBodyFallback: false,
  }),
  defaultCopyTarget: 'full_report',
  snippetCollection: Object.freeze([]),
});

const PROFILE_REGISTRY = Object.freeze({
  [MANDAU_DEFAULT_PROFILE.id]: MANDAU_DEFAULT_PROFILE,
});

export function getTemplateProfile(profileId = TEMPLATE_PROFILE_IDS.MANDAU_DEFAULT) {
  return PROFILE_REGISTRY[profileId] ?? null;
}

export function requireTemplateProfile(profileId = TEMPLATE_PROFILE_IDS.MANDAU_DEFAULT) {
  const profile = getTemplateProfile(profileId);
  if (!profile) throw new Error(`Unknown Template Profile: ${profileId}`);
  return profile;
}

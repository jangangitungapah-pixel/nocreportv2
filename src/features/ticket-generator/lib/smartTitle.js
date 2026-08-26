import { normalizeOperationalText } from './operationalNormalization.js';
import { requireTemplateProfile } from './templateProfiles.js';

function clean(value) {
  return normalizeOperationalText(value);
}

function titleCaseFallback(value) {
  return clean(value).replaceAll('_', ' ').toUpperCase();
}

export function smartTitleInputs(ticket = {}) {
  const alarmContext = ticket.alarmContext ?? {};
  const pathEndpoints = Array.isArray(alarmContext.pathEndpoints)
    ? alarmContext.pathEndpoints.map(clean).filter(Boolean)
    : [];

  return {
    profileId: ticket.templateProfileId ?? 'MANDAU_DEFAULT',
    alarmFamily: clean(alarmContext.alarmFamily),
    transportFamily: clean(alarmContext.transportFamily),
    pathEndpoints,
    externalTtNumber: clean(ticket.externalTtNumber),
  };
}

export function generateSmartTitle(ticket = {}) {
  const inputs = smartTitleInputs(ticket);
  const profile = requireTemplateProfile(inputs.profileId);
  const config = profile.title;
  const condition =
    config.conditionLabels?.[inputs.alarmFamily] ?? titleCaseFallback(inputs.alarmFamily);
  const path = inputs.pathEndpoints.join(config.pathSeparator);
  const identity = inputs.externalTtNumber
    ? `[${config.ttLabel} : ${inputs.externalTtNumber}]`
    : '';

  const operational = [
    condition,
    inputs.transportFamily
      ? `${config.transportJoiner.trim()} ${inputs.transportFamily}`
      : '',
    path,
    identity,
  ]
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

  return [config.prefix, operational].filter(Boolean).join(' ').trim();
}

export function canGenerateSmartTitle(ticket = {}) {
  const inputs = smartTitleInputs(ticket);
  return Boolean(
    inputs.alarmFamily ||
      inputs.transportFamily ||
      inputs.pathEndpoints.length ||
      inputs.externalTtNumber,
  );
}

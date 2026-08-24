import { CAPABILITY } from '../entities/user/authorization.js';

export const PRIMARY_NAVIGATION = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    shortLabel: 'Home',
    to: '/dashboard',
    icon: 'D',
  },
  {
    key: 'generator',
    label: 'Template Generator',
    shortLabel: 'Generate',
    to: '/generator/new',
    icon: 'G',
    requiredCapability: CAPABILITY.CREATE_TICKET,
  },
  {
    key: 'running',
    label: 'Running Ticket',
    shortLabel: 'Running',
    to: '/running',
    icon: 'R',
  },
  {
    key: 'cut-points',
    label: 'Cut Point Tracker',
    shortLabel: 'Map',
    to: '/cut-points',
    icon: 'M',
  },
  {
    key: 'archive',
    label: 'Archive & Restore',
    shortLabel: 'Archive',
    to: '/archive',
    icon: 'A',
    requiredCapability: CAPABILITY.ARCHIVE_RESTORE,
  },
];

export function isNavigationItemActive(pathname, item) {
  if (item.key === 'generator') {
    return pathname.startsWith('/generator');
  }

  return pathname === item.to || pathname.startsWith(`${item.to}/`);
}

import { CAPABILITY } from '../entities/user/authorization.js';

export const PRIMARY_NAVIGATION = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    shortLabel: 'Home',
    to: '/dashboard',
    icon: 'dashboard',
  },
  {
    key: 'generator',
    label: 'Template Generator',
    shortLabel: 'Generate',
    to: '/generator/new',
    icon: 'generator',
    requiredCapability: CAPABILITY.CREATE_TICKET,
  },
  {
    key: 'running',
    label: 'Running Ticket',
    shortLabel: 'Running',
    to: '/running',
    icon: 'running',
  },
  {
    key: 'cut-points',
    label: 'Cut Point Tracker',
    shortLabel: 'Map',
    to: '/cut-points',
    icon: 'map',
  },
  {
    key: 'archive',
    label: 'Archive & Restore',
    shortLabel: 'Archive',
    to: '/archive',
    icon: 'archive',
    requiredCapability: CAPABILITY.ARCHIVE_RESTORE,
  },
  {
    key: 'settings',
    label: 'Settings',
    shortLabel: 'Settings',
    to: '/settings',
    icon: 'settings',
    requiredCapability: CAPABILITY.CREATE_TICKET,
  },
];

const PAGE_META = Object.freeze({
  dashboard: Object.freeze({ key: 'dashboard', label: 'Dashboard', eyebrow: 'Operations' }),
  generator: Object.freeze({
    key: 'generator',
    label: 'Template Generator',
    eyebrow: 'Ticket workspace',
  }),
  running: Object.freeze({ key: 'running', label: 'Running Ticket', eyebrow: 'Live queue' }),
  cutPoints: Object.freeze({
    key: 'cut-points',
    label: 'Cut Point Tracker',
    eyebrow: 'Spatial operations',
  }),
  archive: Object.freeze({
    key: 'archive',
    label: 'Archive & Restore',
    eyebrow: 'Lifecycle history',
  }),
  settings: Object.freeze({ key: 'settings', label: 'Settings', eyebrow: 'Workspace' }),
  ticketDetail: Object.freeze({
    key: 'ticket-detail',
    label: 'Ticket Detail',
    eyebrow: 'Safe review',
  }),
});

export function getPageMeta(pathname) {
  if (pathname.startsWith('/tickets')) return PAGE_META.ticketDetail;
  if (pathname.startsWith('/generator')) return PAGE_META.generator;
  if (pathname.startsWith('/running')) return PAGE_META.running;
  if (pathname.startsWith('/cut-points')) return PAGE_META.cutPoints;
  if (pathname.startsWith('/archive')) return PAGE_META.archive;
  if (pathname.startsWith('/settings')) return PAGE_META.settings;
  return PAGE_META.dashboard;
}

export function isNavigationItemActive(pathname, item) {
  if (item.key === 'generator') {
    return pathname.startsWith('/generator');
  }

  return pathname === item.to || pathname.startsWith(`${item.to}/`);
}

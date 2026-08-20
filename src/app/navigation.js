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
];

export function isNavigationItemActive(pathname, item) {
  if (item.key === 'generator') {
    return pathname.startsWith('/generator');
  }

  return pathname === item.to || pathname.startsWith(`${item.to}/`);
}

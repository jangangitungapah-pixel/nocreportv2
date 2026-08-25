import {
  AlertCircle,
  AlertTriangle,
  Archive,
  ArrowDown,
  ArrowUp,
  CalendarDays,
  Check,
  ClipboardCopy,
  FileText,
  Gauge,
  Info,
  Map,
  Moon,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Sun,
  X,
  Zap,
} from 'lucide-react';

const ICONS = {
  archive: Archive,
  arrowDown: ArrowDown,
  arrowUp: ArrowUp,
  calendar: CalendarDays,
  check: Check,
  close: X,
  copy: ClipboardCopy,
  dashboard: Gauge,
  edit: Pencil,
  error: AlertCircle,
  generator: FileText,
  info: Info,
  map: Map,
  moon: Moon,
  plus: Plus,
  refresh: RefreshCw,
  running: Zap,
  search: Search,
  sun: Sun,
  warning: AlertTriangle,
};

export function AppIcon({ name, size = 18, strokeWidth = 1.9, className, ...props }) {
  const Icon = ICONS[name] ?? Info;
  return (
    <Icon
      aria-hidden="true"
      focusable="false"
      size={size}
      strokeWidth={strokeWidth}
      className={className}
      {...props}
    />
  );
}

export const appIconNames = Object.freeze(Object.keys(ICONS));

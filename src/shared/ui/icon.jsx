import {
  AlertCircle,
  AlertTriangle,
  Archive,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  CalendarDays,
  Check,
  ChevronDown,
  ClipboardCopy,
  Columns3,
  FileText,
  Gauge,
  Info,
  Map,
  Moon,
  MoreHorizontal,
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
  chevronDown: ChevronDown,
  close: X,
  columns: Columns3,
  copy: ClipboardCopy,
  dashboard: Gauge,
  edit: Pencil,
  error: AlertCircle,
  generator: FileText,
  info: Info,
  map: Map,
  moon: Moon,
  moreHorizontal: MoreHorizontal,
  plus: Plus,
  refresh: RefreshCw,
  running: Zap,
  search: Search,
  sort: ArrowUpDown,
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

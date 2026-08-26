import { useEffect, useMemo, useState } from 'react';
import { Group, Panel, Separator, useDefaultLayout } from 'react-resizable-panels';

import { cn } from '../lib/cn.js';

function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return undefined;
    const media = window.matchMedia(query);
    const sync = () => setMatches(media.matches);
    sync();
    media.addEventListener?.('change', sync);
    return () => media.removeEventListener?.('change', sync);
  }, [query]);

  return matches;
}

function safeLocalStorage() {
  if (typeof window === 'undefined') return undefined;
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

export function ResizableWorkspace({
  id,
  primary,
  secondary,
  primaryId = 'primary',
  secondaryId = 'secondary',
  primaryDefault = 62,
  primaryMin = '480px',
  secondaryMin = '320px',
  breakpoint = '(min-width: 1280px)',
  className,
  mobileClassName,
}) {
  const isDesktop = useMediaQuery(breakpoint);
  const storage = useMemo(() => safeLocalStorage(), []);
  const panelIds = useMemo(() => [primaryId, secondaryId], [primaryId, secondaryId]);
  const { defaultLayout, onLayoutChanged } = useDefaultLayout({
    id,
    panelIds,
    storage,
    debounceSaveMs: 0,
    onlySaveAfterUserInteractions: true,
  });

  if (!isDesktop) {
    return (
      <div className={cn('grid gap-3', mobileClassName)}>
        {primary}
        {secondary}
      </div>
    );
  }

  return (
    <Group
      id={id}
      orientation="horizontal"
      defaultLayout={
        defaultLayout ?? {
          [primaryId]: primaryDefault,
          [secondaryId]: 100 - primaryDefault,
        }
      }
      onLayoutChanged={onLayoutChanged}
      className={cn('min-h-0 min-w-0', className)}
    >
      <Panel id={primaryId} minSize={primaryMin} className="min-h-0 min-w-0">
        <div className="h-full min-h-0 overflow-y-auto pr-1">{primary}</div>
      </Panel>
      <Separator
        id={`${id}-separator`}
        className="group relative mx-1 w-2 shrink-0 cursor-col-resize rounded-full outline-none transition-colors hover:bg-[var(--surface-muted)] focus-visible:bg-[var(--surface-muted)] focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
      >
        <span
          className="pointer-events-none absolute bottom-4 left-1/2 top-4 w-px -translate-x-1/2 bg-[var(--border-default)] transition-colors group-hover:bg-[var(--accent-solid)] group-focus-visible:bg-[var(--accent-solid)]"
          aria-hidden="true"
        />
      </Separator>
      <Panel id={secondaryId} minSize={secondaryMin} className="min-h-0 min-w-0">
        <div className="h-full min-h-0 pl-1">{secondary}</div>
      </Panel>
    </Group>
  );
}

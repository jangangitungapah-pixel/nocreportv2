import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

import { cn } from '../lib/cn.js';

/**
 * Variable-height virtualized list for bounded operational datasets.
 *
 * The component owns only viewport/render mechanics. Consumers keep control of
 * item identity, selection, navigation, and mutations. Dynamic measurement is
 * enabled so incident rows can safely grow when titles or progress wrap.
 */
export function VirtualizedList({
  items,
  renderItem,
  getItemKey,
  estimateSize = 72,
  overscan = 6,
  ariaLabel = 'Virtualized data list',
  className,
  itemClassName,
  initialRect,
}) {
  const scrollRef = useRef(null);
  const resolvedEstimateSize =
    typeof estimateSize === 'function' ? estimateSize : () => Number(estimateSize) || 72;

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: resolvedEstimateSize,
    getItemKey: (index) => getItemKey?.(items[index], index) ?? index,
    overscan,
    initialRect,
  });

  return (
    <div
      ref={scrollRef}
      role="list"
      aria-label={ariaLabel}
      className={cn('overflow-y-auto overscroll-contain', className)}
    >
      <div
        className="relative w-full"
        style={{ height: `${virtualizer.getTotalSize()}px` }}
        aria-hidden={items.length === 0 ? 'true' : undefined}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const item = items[virtualItem.index];
          return (
            <div
              key={virtualItem.key}
              ref={virtualizer.measureElement}
              data-index={virtualItem.index}
              role="listitem"
              className={cn('absolute left-0 top-0 w-full', itemClassName)}
              style={{ transform: `translateY(${virtualItem.start}px)` }}
            >
              {renderItem(item, virtualItem.index)}
            </div>
          );
        })}
      </div>
    </div>
  );
}

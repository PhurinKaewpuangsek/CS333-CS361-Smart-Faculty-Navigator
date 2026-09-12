import { useState } from 'react'
import { CaretDown, Palette } from '@phosphor-icons/react'
import {
  AREA_LEGEND_CATEGORIES,
  DEFAULT_CATEGORY_AREA_FILL,
  getCategoryAreaFill,
  getCategoryLabel,
} from '../../services/roomDisplay'

/** Desktop shows the key by default; on phones the map is small, so it starts collapsed. */
function prefersOpenLegend(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return true
  return window.matchMedia('(min-width: 640px)').matches
}

/**
 * Colour key for the floor-plan area tints.
 *
 * The floor plan used to carry its own baked-in legend explaining a department colour
 * scheme. Room areas are now tinted by category from CATEGORY_AREA_FILLS, so the key is
 * rendered here off that same data — one source of truth for what the map colours mean.
 */
function MapLegend() {
  const [isOpen, setIsOpen] = useState<boolean>(prefersOpenLegend)

  const entries = [
    ...AREA_LEGEND_CATEGORIES.map((category) => ({
      key: category,
      label: getCategoryLabel(category),
      fill: getCategoryAreaFill(category),
    })),
    { key: 'other', label: 'อื่นๆ / สิ่งอำนวยความสะดวก', fill: DEFAULT_CATEGORY_AREA_FILL },
  ]

  return (
    <div className="absolute bottom-6 left-4 z-10 sm:bottom-6 sm:left-6">
      <div className="rounded-2xl bg-white/95 shadow-2xl backdrop-blur-md border border-slate-100/80">
        <button
          type="button"
          aria-expanded={isOpen}
          aria-controls="map-legend-items"
          onClick={() => setIsOpen((open) => !open)}
          className="flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-all duration-150 cursor-pointer"
        >
          <Palette size={18} weight="bold" aria-hidden="true" />
          <span>ประเภทพื้นที่</span>
          <CaretDown
            size={14}
            weight="bold"
            aria-hidden="true"
            className={
              isOpen
                ? 'ml-auto rotate-180 transition-transform duration-200'
                : 'ml-auto transition-transform duration-200'
            }
          />
        </button>

        <ul id="map-legend-items" hidden={!isOpen} className="px-3 pb-2.5 pt-0.5 space-y-1.5">
          {entries.map((entry) => (
            <li key={entry.key} className="flex items-center gap-2 text-xs text-slate-600">
              <span
                data-testid={`legend-swatch-${entry.key}`}
                aria-hidden="true"
                className="h-3 w-3 shrink-0 rounded-sm border border-slate-300"
                style={{ backgroundColor: entry.fill }}
              />
              <span>{entry.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default MapLegend

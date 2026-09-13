import { ArrowClockwise, CircleNotch, WarningCircle } from '@phosphor-icons/react'

export interface MapLoadStatusProps {
  loading: boolean
  error: Error | null
  onRetry?: () => void
}

const PILL =
  'absolute left-1/2 top-24 z-20 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium shadow-2xl backdrop-blur-md sm:top-6'

/**
 * Tells the user why the map has no markers yet.
 *
 * The locations API takes a couple of seconds to answer, and until it does the floor plan
 * is drawn with no rooms on it — which reads as "this building has nothing" rather than
 * "still loading". Floats over the map so it is visible without opening the search panel.
 */
function MapLoadStatus({ loading, error, onRetry }: MapLoadStatusProps) {
  if (loading) {
    return (
      <div role="status" aria-live="polite" className={`${PILL} border-slate-100/80 bg-white/95 text-slate-700`}>
        <CircleNotch size={18} weight="bold" className="animate-spin text-blue-600" aria-hidden="true" />
        <span>กำลังโหลดตำแหน่งห้อง...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div role="alert" className={`${PILL} border-red-100 bg-white/95 text-red-700`}>
        <WarningCircle size={18} weight="bold" aria-hidden="true" />
        <span>โหลดตำแหน่งห้องไม่สำเร็จ</span>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="ml-1 flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-red-100 transition-colors duration-150 cursor-pointer"
          >
            <ArrowClockwise size={14} weight="bold" aria-hidden="true" />
            ลองใหม่
          </button>
        )}
      </div>
    )
  }

  return null
}

export default MapLoadStatus

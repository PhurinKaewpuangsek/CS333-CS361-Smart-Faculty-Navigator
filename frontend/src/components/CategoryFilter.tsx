import { CATEGORY_FILTERS } from '../services/filterRooms.ts'

interface CategoryFilterProps {
  value: string
  onChange: (categoryKey: string) => void
}

export default function CategoryFilter({ value, onChange }: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="กรองตามประเภทห้อง">
      {CATEGORY_FILTERS.map((option) => {
        const isActive = option.key === value

        return (
          <button
            key={option.key}
            type="button"
            onClick={() => onChange(option.key)}
            aria-pressed={isActive}
            className={
              isActive
                ? 'rounded-full bg-blue-600 px-4 py-1.5 text-sm font-medium text-white'
                : 'rounded-full border border-slate-300 px-4 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50'
            }
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

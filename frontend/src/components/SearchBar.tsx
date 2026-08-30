import type { RefObject, KeyboardEvent } from 'react'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  onFocus?: () => void
  onKeyDown?: (event: KeyboardEvent<HTMLInputElement>) => void
  inputRef?: RefObject<HTMLInputElement | null>
  placeholder?: string
}

export default function SearchBar({
  value,
  onChange,
  onFocus,
  onKeyDown,
  inputRef,
  placeholder = 'ค้นหาห้อง เช่น 109, ห้องบรรยาย 1',
}: SearchBarProps) {
  return (
    <div className="flex items-center gap-2 rounded-2xl bg-white px-4 py-3 shadow-lg">
      <svg
        aria-hidden="true"
        viewBox="0 0 20 20"
        className="h-5 w-5 flex-shrink-0 text-slate-400"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
      >
        <circle cx="9" cy="9" r="6" />
        <path d="m17 17-3.5-3.5" strokeLinecap="round" />
      </svg>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onFocus={onFocus}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        aria-label="ค้นหาห้อง"
        className="w-full border-none bg-transparent text-base text-slate-900 outline-none placeholder:text-slate-400"
      />
    </div>
  )
}


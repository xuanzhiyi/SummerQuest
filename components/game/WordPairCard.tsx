'use client'

export type CardState = 'idle' | 'selected' | 'connected' | 'correct' | 'incorrect'

interface Props {
  id: string
  text: string
  hint?: string // pinyin for Chinese
  side: 'left' | 'right'
  state: CardState
  onPress: (id: string) => void
  cardRef?: (el: HTMLDivElement | null) => void
}

const stateStyles: Record<CardState, string> = {
  idle:      'bg-white border-gray-300 text-gray-900 hover:border-amber-400 hover:bg-amber-50',
  selected:  'bg-amber-100 border-amber-500 text-amber-900 ring-2 ring-amber-400',
  connected: 'bg-indigo-50 border-indigo-400 text-indigo-900',
  correct:   'bg-green-100 border-green-500 text-green-900',
  incorrect: 'bg-red-100 border-red-500 text-red-900',
}

export default function WordPairCard({ id, text, hint, state, onPress, cardRef }: Props) {
  return (
    <div
      ref={cardRef}
      onClick={() => onPress(id)}
      className={`
        relative flex items-center justify-between gap-1
        min-h-[52px] px-3 py-2 rounded-xl border-2 cursor-pointer
        transition-all duration-150 select-none
        text-base font-medium
        ${stateStyles[state]}
      `}
    >
      <div className="flex flex-col">
        <span>{text}</span>
        {hint && <span className="text-xs font-normal text-gray-500">{hint}</span>}
      </div>
      <div className="shrink-0">
        {state === 'correct'   && <span className="text-green-600 font-bold">✓</span>}
        {state === 'incorrect' && <span className="text-red-600 font-bold">✗</span>}
      </div>
    </div>
  )
}

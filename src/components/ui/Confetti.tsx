const PIECES = [
  { left: '8%', delay: '0ms', color: '#58cc02', drift: '-28px' },
  { left: '22%', delay: '90ms', color: '#1cb0f6', drift: '36px' },
  { left: '38%', delay: '40ms', color: '#ff9600', drift: '-18px' },
  { left: '54%', delay: '140ms', color: '#ce82ff', drift: '42px' },
  { left: '68%', delay: '20ms', color: '#ff4b4b', drift: '-34px' },
  { left: '82%', delay: '110ms', color: '#ffc800', drift: '22px' },
  { left: '14%', delay: '180ms', color: '#1f45f5', drift: '16px' },
  { left: '74%', delay: '70ms', color: '#14b8a6', drift: '-40px' },
]

/** Lightweight CSS burst used on the results hero — no canvas, no extra libraries. */
export function Confetti() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {PIECES.map((piece, index) => (
        <span
          key={index}
          className="absolute top-2 h-2.5 w-2 rounded-[2px] animate-[confetti-fall_1.8s_ease_both]"
          style={{
            left: piece.left,
            backgroundColor: piece.color,
            animationDelay: piece.delay,
            ['--drift' as string]: piece.drift,
          }}
        />
      ))}
    </div>
  )
}

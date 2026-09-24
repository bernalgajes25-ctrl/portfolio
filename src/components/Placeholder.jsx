// Shown when an item has no image yet
export default function Placeholder({ text }) {
  const initials = text
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 3)
    .toUpperCase()
  return (
    <div className="placeholder" aria-hidden="true">
      <span>{initials}</span>
    </div>
  )
}

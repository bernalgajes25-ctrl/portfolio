export default function SectionTitle({ index, label, title }) {
  return (
    <header className="section-title">
      <span className="section-title__tag">
        {'// '}
        {String(index).padStart(2, '0')} {label}
      </span>
      <h2>{title}</h2>
    </header>
  )
}

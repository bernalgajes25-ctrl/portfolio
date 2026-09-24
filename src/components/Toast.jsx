// Small "achievement unlocked" style popup
export default function Toast({ toast }) {
  if (!toast) return null
  return (
    <div className="toast" role="status" key={toast.id}>
      <span className="toast__icon" aria-hidden="true">
        ★
      </span>
      <div>
        <strong>{toast.title}</strong>
        <p>{toast.text}</p>
      </div>
    </div>
  )
}

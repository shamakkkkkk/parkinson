export default function EmptyState({ title, description, action }) {
  return (
    <div className="empty-state">
      <strong>{title}</strong>
      {description ? <span>{description}</span> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

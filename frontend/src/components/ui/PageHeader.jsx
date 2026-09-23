export default function PageHeader({ eyebrow, title, description }) {
  return (
    <div className="page-header">
      {eyebrow ? <div className="eyebrow">{eyebrow}</div> : null}
      <h2>{title}</h2>
      {description ? <p>{description}</p> : null}
    </div>
  );
}

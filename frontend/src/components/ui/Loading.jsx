export default function Loading({ label = "Loading..." }) {
  return (
    <div className="loading-row">
      <span className="spinner spinner-dark" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

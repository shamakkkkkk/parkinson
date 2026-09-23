export default function CandidateSummaryCard({ candidate }) {
  if (!candidate) return null;

  const isPositive = candidate.normalizedStatus === "positive";
  const displayDate = candidate.properties?.sessionDate || "\u2014";

  const fields = [
    { label: "Candidate Number", value: candidate.patientNumber },
    { label: "Age", value: candidate.normalizedAge ?? "N/A" },
    { label: "Gender", value: candidate.displayGender },
    { label: "Height / Weight", value: `${candidate.height ?? "\u2014"} cm / ${candidate.weight ?? "\u2014"} kg` },
    { label: "Session Date", value: displayDate },
  ];

  return (
    <div className="candidate-summary">
      <div className="candidate-summary-grid">
        {fields.map((field) => (
          <div className="candidate-summary-item" key={field.label}>
            <span className="label">{field.label}</span>
            <span className="value">{field.value}</span>
          </div>
        ))}
        <div className="candidate-summary-item">
          <span className="label">Parkinson&rsquo;s Status</span>
          <span className={`value ${isPositive ? "tone-positive" : "tone-negative"}`}>
            {isPositive ? "\u25CF Positive" : "\u25CF Negative"}
          </span>
        </div>
      </div>
    </div>
  );
}

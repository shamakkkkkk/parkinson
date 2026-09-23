const TONE_CLASS = {
  positive: "badge-positive",
  negative: "badge-negative",
  neutral: "badge-neutral",
  info: "badge-info",
};

export default function Badge({ tone = "neutral", children }) {
  return <span className={`badge ${TONE_CLASS[tone] || TONE_CLASS.neutral}`}>{children}</span>;
}

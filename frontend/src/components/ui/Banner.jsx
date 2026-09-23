export default function Banner({ tone = "info", children }) {
  if (!children) return null;
  return <div className={`banner banner-${tone}`}>{children}</div>;
}

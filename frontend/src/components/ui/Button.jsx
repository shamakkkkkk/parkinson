const VARIANT_CLASS = {
  primary: "btn-primary",
  secondary: "btn-secondary",
  ghost: "btn-ghost",
  danger: "btn-danger",
  back: "btn-back",
};

export default function Button({
  children,
  variant = "primary",
  size,
  onClick,
  disabled = false,
  loading = false,
  className = "",
  type = "button",
  fullWidth = false,
  ...rest
}) {
  const classes = ["btn", VARIANT_CLASS[variant] || VARIANT_CLASS.primary];
  if (size === "sm") classes.push("btn-sm");
  if (fullWidth) classes.push("btn-full");
  if (className) classes.push(className);

  return (
    <button
      type={type}
      className={classes.join(" ")}
      onClick={onClick}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? <span className="spinner" aria-hidden="true" /> : null}
      {children}
    </button>
  );
}

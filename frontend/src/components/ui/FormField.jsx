export default function FormField({
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  min,
  max,
  step,
  options = [],
  disabled = false,
  required = false,
  readOnly = false,
  inputMode,
  pattern,
  error,
  valid = false,
  onBlur,
  hint,
  id,
}) {
  const fieldId = id || `field-${label?.toString().toLowerCase().replace(/\s+/g, "-")}`;
  const stateClass = error ? "is-invalid" : valid ? "is-valid" : "";

  return (
    <div className="form-group">
      <label htmlFor={fieldId}>{label}</label>

      {type === "select" ? (
        <select
          id={fieldId}
          className={`field-select ${stateClass}`}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          onBlur={onBlur}
        >
          <option value="">Select an option</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : type === "textarea" ? (
        <textarea
          id={fieldId}
          className={`field-textarea ${stateClass}`}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          disabled={disabled}
          readOnly={readOnly}
          required={required}
        />
      ) : (
        <input
          id={fieldId}
          type={type}
          className={`field-input ${stateClass}`}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          min={min}
          max={max}
          step={step}
          inputMode={inputMode}
          pattern={pattern}
          disabled={disabled}
          readOnly={readOnly}
          required={required}
        />
      )}
      {error ? (
        <div className="field-error">{error}</div>
      ) : hint ? (
        <div className="field-hint">{hint}</div>
      ) : null}
    </div>
  );
}

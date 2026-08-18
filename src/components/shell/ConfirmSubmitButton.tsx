"use client";

export function ConfirmSubmitButton({
  label,
  ariaLabel,
  confirmText,
  className = "btn-ghost btn-danger",
}: {
  label: string;
  ariaLabel?: string;
  confirmText: string;
  className?: string;
}) {
  return (
    <button
      type="submit"
      className={className}
      aria-label={ariaLabel}
      onClick={(e) => {
        if (!confirm(confirmText)) e.preventDefault();
      }}
    >
      {label}
    </button>
  );
}

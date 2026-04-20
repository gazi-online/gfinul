import React, { forwardRef, useId, useMemo, useState } from 'react';
import { getInteractiveInputClass, INPUT_STATE_CLASSES, type InputVisualState } from './inputFieldStyles';
import { useTranslation } from 'react-i18next';

type TextInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> & {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string | null;
  hint?: string;
  success?: boolean;
  successMessage?: string;
};

const SuccessIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
    <circle cx="12" cy="12" r="10" className="fill-emerald-500" />
    <path
      d="m8.5 12.3 2.3 2.4 4.7-5.5"
      stroke="white"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(function TextInput(
  {
    label,
    value,
    onChange,
    error,
    hint,
    success = false,
    successMessage,
    id,
    name,
    disabled = false,
    required = false,
    className = '',
    onBlur,
    onFocus,
    onInvalid,
    type = 'text',
    ...props
  },
  ref,
) {
  const { t } = useTranslation();
  const generatedId = useId();
  const inputId = id ?? `text-input-${generatedId}`;
  const errorId = `${inputId}-error`;
  const hintId = `${inputId}-hint`;
  const successId = `${inputId}-success`;
  const [isFocused, setIsFocused] = useState(false);
  const [isTouched, setIsTouched] = useState(false);

  const trimmedValue = value.trim();
  const hasValue = trimmedValue.length > 0;

  const resolvedError = useMemo(() => {
    if (error) {
      return error;
    }

    if (!isTouched || !required || hasValue) {
      return null;
    }

    return t('validation.required');
  }, [error, hasValue, isTouched, required, t]);

  const showSuccess = !disabled && !resolvedError && success && hasValue;

  const state: InputVisualState = disabled
    ? 'disabled'
    : resolvedError
      ? 'error'
      : isFocused
        ? hasValue
          ? 'typing'
          : 'focus'
        : showSuccess
          ? 'success'
          : hasValue
            ? 'filled'
            : 'default';

  const helperId = resolvedError ? errorId : showSuccess && successMessage ? successId : hint ? hintId : undefined;

  return (
    <div className={`w-full ${className}`}>
      <label htmlFor={inputId} className="mb-2 block text-sm font-bold text-gray-700 dark:text-slate-300">
        {label}
      </label>

      <div className="relative">
        <input
          {...props}
          ref={ref}
          id={inputId}
          name={name ?? inputId}
          type={type}
          value={value}
          disabled={disabled}
          required={required}
          aria-invalid={resolvedError ? 'true' : 'false'}
          aria-disabled={disabled ? 'true' : undefined}
          aria-describedby={helperId}
          data-state={state}
          onChange={(event) => onChange(event.target.value)}
          onFocus={(event) => {
            setIsFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setIsFocused(false);
            setIsTouched(true);
            onBlur?.(event);
          }}
          onInvalid={(event) => {
            event.preventDefault();
            setIsTouched(true);
            onInvalid?.(event);
          }}
          className={`w-full rounded-2xl border px-4 py-3.5 pr-11 text-sm font-medium outline-none transition-all duration-200 ease-out placeholder:text-slate-400 caret-blue-600 dark:caret-blue-300 ${INPUT_STATE_CLASSES[state]} ${getInteractiveInputClass(state)}`}
        />

        {showSuccess ? (
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center justify-center text-emerald-500">
            <SuccessIcon />
          </span>
        ) : null}
      </div>

      {resolvedError ? (
        <p id={errorId} className="mt-2 text-xs font-semibold text-rose-500 animate-fade-slide-in">
          {resolvedError}
        </p>
      ) : showSuccess && successMessage ? (
        <p id={successId} className="mt-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 animate-fade-slide-in">
          {successMessage}
        </p>
      ) : hint ? (
        <p id={hintId} className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          {hint}
        </p>
      ) : null}
    </div>
  );
});

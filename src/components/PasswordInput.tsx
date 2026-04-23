import React, { forwardRef, useId, useMemo, useState } from 'react';
import { getInteractiveInputClass, INPUT_STATE_CLASSES, type InputVisualState } from './inputFieldStyles';
import { useTranslation } from 'react-i18next';

type PasswordInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'> & {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string | null;
  hint?: string;
  minLength?: number;
};

const EyeIcon = ({ open }: { open: boolean }) => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
    {open ? (
      <>
        <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
      </>
    ) : (
      <>
        <path d="M3 3 21 21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M10.6 6.3A10.4 10.4 0 0 1 12 6c6 0 9.5 6 9.5 6a17.6 17.6 0 0 1-4 4.4M6.5 17.1A17 17 0 0 1 2.5 12s1.5-2.6 4.4-4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M9.9 9.9A3 3 0 0 0 14 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </>
    )}
  </svg>
);

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(function PasswordInput(
  {
    label,
    value,
    onChange,
    error,
    hint,
    id,
    name,
    disabled = false,
    required = false,
    className = '',
    onBlur,
    onFocus,
    onInvalid,
    minLength = 6,
    placeholder,
    autoComplete = 'current-password',
    ...props
  },
  ref,
) {
  const { t } = useTranslation();
  const generatedId = useId();
  const inputId = id ?? `password-input-${generatedId}`;
  const errorId = `${inputId}-error`;
  const hintId = `${inputId}-hint`;
  const [isFocused, setIsFocused] = useState(false);
  const [isTouched, setIsTouched] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const hasValue = value.length > 0;

  const resolvedError = useMemo(() => {
    if (error) {
      return error;
    }

    if (!isTouched) {
      return null;
    }

    if (!hasValue) {
      return required ? t('validation.passwordRequired') : null;
    }

    return value.length >= minLength ? null : t('validation.passwordMin', { count: minLength });
  }, [error, hasValue, isTouched, minLength, required, t, value.length]);

  const showSuccess = !disabled && !resolvedError && !isFocused && value.length >= minLength && isTouched;

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
          type={isVisible ? 'text' : 'password'}
          value={value}
          disabled={disabled}
          required={required}
          autoComplete={autoComplete}
          placeholder={placeholder ?? t('auth.passwordPlaceholder')}
          aria-invalid={resolvedError ? 'true' : 'false'}
          aria-disabled={disabled ? 'true' : undefined}
          aria-describedby={resolvedError ? errorId : hint ? hintId : undefined}
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
          className={`w-full rounded-2xl border px-4 py-3.5 pr-12 text-sm font-medium outline-none transition-all duration-200 ease-out placeholder:text-slate-400 caret-blue-600 dark:caret-blue-300 ${INPUT_STATE_CLASSES[state]} ${getInteractiveInputClass(state)}`}
        />

        <button
          type="button"
          onClick={() => setIsVisible((prev) => !prev)}
          disabled={disabled}
          aria-label={isVisible ? t('auth.hidePassword') : t('auth.showPassword')}
          className="absolute inset-y-0 right-3 flex items-center justify-center text-slate-400 transition hover:text-blue-500 disabled:cursor-not-allowed disabled:text-slate-300 dark:text-slate-500 dark:hover:text-blue-300"
        >
          <EyeIcon open={isVisible} />
        </button>
      </div>

      {resolvedError ? (
        <p id={errorId} className="mt-2 text-xs font-semibold text-rose-500 animate-fade-slide-in">
          {resolvedError}
        </p>
      ) : hint ? (
        <p id={hintId} className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          {hint}
        </p>
      ) : null}
    </div>
  );
});

import React, { forwardRef, useId, useMemo, useState } from 'react';
import { getInteractiveInputClass, INPUT_STATE_CLASSES, type InputVisualState } from './inputFieldStyles';
import { useTranslation } from 'react-i18next';

type TextareaInputProps = Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'value' | 'onChange'> & {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string | null;
  hint?: string;
  validator?: (value: string) => boolean;
  invalidMessage?: string;
  requiredMessage?: string;
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

export const TextareaInput = forwardRef<HTMLTextAreaElement, TextareaInputProps>(function TextareaInput(
  {
    label,
    value,
    onChange,
    error,
    hint,
    validator,
    invalidMessage,
    requiredMessage,
    id,
    name,
    disabled = false,
    required = false,
    className = '',
    rows = 3,
    onBlur,
    onFocus,
    onInvalid,
    ...props
  },
  ref,
) {
  const { t } = useTranslation();
  const generatedId = useId();
  const inputId = id ?? `textarea-input-${generatedId}`;
  const errorId = `${inputId}-error`;
  const hintId = `${inputId}-hint`;
  const [isFocused, setIsFocused] = useState(false);
  const [isTouched, setIsTouched] = useState(false);

  const trimmedValue = value.trim();
  const hasValue = trimmedValue.length > 0;
  const isValidValue = validator ? validator(trimmedValue) : true;

  const resolvedError = useMemo(() => {
    if (error) {
      return error;
    }

    if (!isTouched) {
      return null;
    }

    if (!hasValue) {
      return required ? requiredMessage ?? t('validation.required') : null;
    }

    return isValidValue ? null : invalidMessage ?? t('validation.valueInvalid');
  }, [error, hasValue, invalidMessage, isTouched, isValidValue, required, requiredMessage, t]);

  const showSuccess = !disabled && !resolvedError && !isFocused && hasValue && isTouched;

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

  const helperId = resolvedError ? errorId : hint ? hintId : undefined;

  return (
    <div className={`w-full ${className}`}>
      <label htmlFor={inputId} className="mb-2 block text-sm font-bold text-gray-700 dark:text-slate-300">
        {label}
      </label>

      <div className="relative">
        <textarea
          {...props}
          ref={ref}
          id={inputId}
          name={name ?? inputId}
          value={value}
          rows={rows}
          placeholder={props.placeholder}
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
          className={`w-full resize-none rounded-2xl border px-4 py-3.5 pr-11 text-sm font-medium outline-none transition-all duration-200 ease-out placeholder:text-slate-400 caret-blue-600 dark:caret-blue-300 ${INPUT_STATE_CLASSES[state]} ${getInteractiveInputClass(state)}`}
        />

        {showSuccess ? (
          <span className="pointer-events-none absolute right-3 top-3 text-emerald-500">
            <SuccessIcon />
          </span>
        ) : null}
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

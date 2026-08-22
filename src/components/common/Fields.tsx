import { forwardRef, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';

interface FieldProps {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  id: string;
  children: React.ReactNode;
}

export function Field({ label, hint, error, required, id, children }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-slate-700 dark:text-slate-200">
        {label}
        {required ? <span className="ml-0.5 text-rose-500" aria-hidden="true">*</span> : null}
      </label>
      {children}
      {hint && !error ? <p className="text-xs text-slate-400 dark:text-slate-500">{hint}</p> : null}
      {error ? (
        <p role="alert" className="text-xs font-medium text-rose-600 dark:text-rose-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}

const inputBase =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 disabled:opacity-60';

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(function TextInput(
  { invalid, className = '', ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      className={`${inputBase} ${invalid ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/30' : ''} ${className}`}
      {...props}
    />
  );
});

interface SelectInputProps extends SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
}

export const SelectInput = forwardRef<HTMLSelectElement, SelectInputProps>(function SelectInput(
  { invalid, className = '', children, ...props },
  ref,
) {
  return (
    <select
      ref={ref}
      className={`${inputBase} ${invalid ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/30' : ''} ${className}`}
      {...props}
    >
      {children}
    </select>
  );
});

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea(
  { invalid, className = '', ...props },
  ref,
) {
  return (
    <textarea
      ref={ref}
      className={`${inputBase} ${invalid ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/30' : ''} ${className}`}
      {...props}
    />
  );
});

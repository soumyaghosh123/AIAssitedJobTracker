import { Loader2 } from 'lucide-react';

interface SpinnerProps {
  label?: string;
  className?: string;
}

export function Spinner({ label = 'Loading…', className = '' }: SpinnerProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-center justify-center gap-3 py-12 text-slate-500 dark:text-slate-400 ${className}`}
    >
      <Loader2 className="h-5 w-5 animate-spin text-blue-600 dark:text-blue-400" aria-hidden="true" />
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}

export function PageSpinner() {
  return <Spinner label="Loading…" className="py-24" />;
}

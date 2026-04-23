import React from 'react';
import { AlertCircle, CheckCircle, Info, type LucideIcon } from 'lucide-react';

export type ToastVariant = 'success' | 'info' | 'error';

export type ToastItem = {
  id: string;
  type: ToastVariant;
  title: string;
  message: string;
  visible: boolean;
};

type ToastProps = {
  toast: ToastItem;
};

const TOAST_STYLES: Record<
  ToastVariant,
  {
    accent: string;
    border: string;
    Icon: LucideIcon;
  }
> = {
  success: {
    accent: 'text-emerald-600',
    border: 'border-emerald-500',
    Icon: CheckCircle,
  },
  info: {
    accent: 'text-blue-600',
    border: 'border-blue-500',
    Icon: Info,
  },
  error: {
    accent: 'text-rose-600',
    border: 'border-rose-500',
    Icon: AlertCircle,
  },
};

export function Toast({ toast }: ToastProps) {
  const { accent, border, Icon } = TOAST_STYLES[toast.type];

  return (
    <div
      className={`pointer-events-auto w-full max-w-[360px] rounded-lg border-l-[3px] ${border} bg-white px-4 py-3.5 shadow-[0_1px_3px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/90 transition-all duration-300 hover:translate-x-0.5 hover:shadow-[0_10px_25px_rgba(15,23,42,0.10)] ${
        toast.visible ? 'translate-x-0 opacity-100' : 'translate-x-6 opacity-0'
      }`}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-2.5">
        <Icon className={`mt-0.5 h-[18px] w-[18px] shrink-0 ${accent}`} strokeWidth={1.9} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-800">{toast.title}</p>
          <p className="mt-1 text-sm leading-5 text-slate-500">{toast.message}</p>
        </div>
      </div>
    </div>
  );
}

export type InputVisualState = 'default' | 'filled' | 'focus' | 'typing' | 'success' | 'error' | 'disabled';

export const INPUT_STATE_CLASSES: Record<InputVisualState, string> = {
  default:
    'border-slate-200 bg-white text-slate-900 shadow-[0_1px_2px_rgba(15,23,42,0.04)] dark:border-slate-700 dark:bg-slate-900/60 dark:text-white',
  filled:
    'border-slate-300 bg-white text-slate-900 shadow-[0_2px_8px_rgba(15,23,42,0.05)] dark:border-slate-600 dark:bg-slate-900/70 dark:text-white',
  focus:
    'border-blue-500 bg-white text-slate-900 ring-4 ring-blue-500/15 shadow-[0_0_0_1px_rgba(59,130,246,0.3)] dark:border-blue-400 dark:bg-slate-900/80 dark:text-white dark:ring-blue-400/20',
  typing:
    'border-blue-500 bg-white text-slate-900 ring-4 ring-blue-500/15 shadow-[0_0_0_1px_rgba(59,130,246,0.3)] dark:border-blue-400 dark:bg-slate-900/80 dark:text-white dark:ring-blue-400/20',
  success:
    'border-emerald-400 bg-emerald-50/60 text-slate-900 shadow-[0_0_0_1px_rgba(74,222,128,0.25)] dark:border-emerald-400 dark:bg-emerald-950/20 dark:text-white',
  error:
    'border-rose-400 bg-rose-50/60 text-slate-900 shadow-[0_0_0_1px_rgba(251,113,133,0.25)] dark:border-rose-400 dark:bg-rose-950/20 dark:text-white',
  disabled:
    'cursor-not-allowed border-slate-200 bg-slate-200/80 text-slate-500 shadow-none placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500 dark:placeholder:text-slate-500',
};

export const getInteractiveInputClass = (state: InputVisualState) =>
  state === 'disabled' || state === 'error' || state === 'focus' || state === 'typing' || state === 'success'
    ? ''
    : 'hover:border-blue-300 hover:shadow-[0_8px_24px_rgba(59,130,246,0.08)] dark:hover:border-blue-500/70';

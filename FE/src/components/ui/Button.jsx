import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function Button({ className, variant = 'primary', isLoading, children, ...props }) {
  const variants = {
    primary: 'bg-teal-600 text-white hover:bg-teal-700 shadow-lg shadow-teal-600/20',
    secondary: 'bg-white text-slate-900 border border-slate-200 hover:bg-slate-50',
    danger: 'bg-red-50 text-red-600 hover:bg-red-100',
    ghost: 'bg-transparent text-slate-600 hover:bg-slate-50',
  };

  return (
    <button
      {...props}
      disabled={props.disabled || isLoading}
      className={twMerge(
        'px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 select-none flex items-center justify-center gap-2',
        variants[variant],
        className
      )}
    >
      {isLoading && (
        <svg className="animate-spin h-3 w-3 text-current" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {children}
    </button>
  );
}

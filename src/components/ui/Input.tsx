// src/components/ui/Input.tsx
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    hint?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, hint, className, ...props }, ref) => {
        return (
            <div className="w-full flex flex-col gap-1.5 text-right">
                {label && <label className="text-sm font-medium text-slate-300">{label}</label>}
                <input
                    ref={ref}
                    className={`w-full bg-slate-900/80 border ${error ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20' : 'border-slate-800 focus:border-blue-500 focus:ring-blue-500/20'} rounded-xl px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-4 transition duration-200 ${className || ''}`}
                    {...props}
                />
                {hint && !error && <span className="text-xs text-slate-400">{hint}</span>}
                {error && <span className="text-xs text-rose-400 font-medium">{error}</span>}
            </div>
        );
    }
);
Input.displayName = 'Input';
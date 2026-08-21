// src/components/ui/Button.tsx
import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'danger';
    isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
    children,
    className,
    variant = 'primary',
    isLoading,
    disabled,
    ...props
}) => {
    const base = "inline-flex items-center justify-center font-medium rounded-xl px-5 py-2.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:opacity-50 disabled:cursor-not-allowed";

    const variants = {
        primary: "bg-blue-600 hover:bg-blue-500 text-white focus:ring-blue-500 shadow-lg shadow-blue-600/20",
        secondary: "bg-slate-800 hover:bg-slate-700 text-slate-100 focus:ring-slate-600",
        outline: "border border-slate-700 hover:bg-slate-900 text-slate-300 hover:text-white focus:ring-slate-700",
        danger: "bg-rose-600 hover:bg-rose-500 text-white focus:ring-rose-500"
    };

    return (
        <button
            className={twMerge(clsx(base, variants[variant], className))}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading ? (
                <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                    </svg>
                    جاري التحميل...
                </span>
            ) : children}
        </button>
    );
};
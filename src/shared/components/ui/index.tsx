import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'outline' | 'ghost', size?: 'sm' | 'md' | 'lg' }>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center font-medium transition-all focus:outline-none disabled:opacity-50 disabled:pointer-events-none rounded-xl otto-label text-[10px]",
          {
            "bg-white text-black hover:bg-white/90 shadow-lg": variant === 'primary',
            "bg-white/5 text-white hover:bg-white/10 border border-white/10": variant === 'secondary',
            "border border-white/20 text-white hover:bg-white/5": variant === 'outline',
            "text-white/40 hover:text-white hover:bg-white/5": variant === 'ghost',
            "h-10 px-4": size === 'sm',
            "h-12 px-6": size === 'md',
            "h-14 px-8": size === 'lg',
          },
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("glass-card", className)} {...props} />
  )
);
Card.displayName = "Card";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { icon?: React.ReactNode }>(
  ({ className, icon, ...props }, ref) => (
    <div className="relative">
      {icon && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20">
          {icon}
        </div>
      )}
      <input
        ref={ref}
        className={cn(
          "flex h-14 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-white/20 focus:border-white/20 focus:bg-white/[0.07] transition-all outline-none disabled:opacity-50",
          icon && "pl-12",
          className
        )}
        {...props}
      />
    </div>
  )
);
Input.displayName = "Input";

export const Badge = ({ children, className, variant = 'default' }: { children: React.ReactNode, className?: string, variant?: 'default' | 'success' | 'warning' | 'danger' | 'purple' }) => {
  return (
    <span className={cn(
      "inline-flex items-center rounded-full px-2.5 py-1 text-[8px] otto-label uppercase tracking-widest transition-all",
      {
        "bg-white/10 text-white border border-white/10": variant === 'default',
        "bg-white/5 text-white/60 border border-white/5": variant === 'success',
        "bg-white/5 text-white/40 border border-white/5": variant === 'warning',
        "bg-red-500/10 text-red-400 border border-red-500/20": variant === 'danger',
        "bg-white/10 text-white border border-white/10": variant === 'purple',
      },
      className
    )}>
      {children}
    </span>
  );
};

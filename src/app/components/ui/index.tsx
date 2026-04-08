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
          "inline-flex items-center justify-center font-medium transition-all focus:outline-none disabled:opacity-50 disabled:pointer-events-none rounded-lg",
          {
            "bg-gradient-to-r from-[#aa68ff] to-[#820ad1] text-white shadow-[0_0_15px_rgba(170,104,255,0.3)] hover:shadow-[0_0_25px_rgba(170,104,255,0.5)] hover:-translate-y-[1px]": variant === 'primary',
            "bg-[rgba(255,255,255,0.05)] text-[#F4F5F8] hover:bg-[rgba(255,255,255,0.1)] border border-[rgba(255,255,255,0.1)]": variant === 'secondary',
            "border border-[rgba(255,255,255,0.2)] text-[#F4F5F8] hover:bg-[rgba(255,255,255,0.05)]": variant === 'outline',
            "text-[#8B949E] hover:text-[#F4F5F8] hover:bg-[rgba(255,255,255,0.05)]": variant === 'ghost',
            "h-8 px-3 text-xs": size === 'sm',
            "h-10 px-4 py-2 text-sm": size === 'md',
            "h-12 px-6 py-3 text-base": size === 'lg',
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
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8B949E]">
          {icon}
        </div>
      )}
      <input
        ref={ref}
        className={cn(
          "flex h-10 w-full rounded-md border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.02)] px-3 py-2 text-sm text-[#F4F5F8] ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[#8B949E] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#aa68ff] disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
          icon && "pl-10",
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
      "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
      {
        "bg-[rgba(255,255,255,0.1)] text-[#F4F5F8]": variant === 'default',
        "bg-[rgba(116,238,21,0.1)] text-[#74ee15]": variant === 'success',
        "bg-[rgba(234,179,8,0.1)] text-yellow-400": variant === 'warning',
        "bg-[rgba(239,68,68,0.1)] text-red-500": variant === 'danger',
        "bg-[rgba(170,104,255,0.1)] text-[#aa68ff]": variant === 'purple',
      },
      className
    )}>
      {children}
    </span>
  );
};

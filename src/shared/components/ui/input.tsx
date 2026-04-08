import * as React from "react";

import { cn } from "./utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "placeholder:text-white/20 selection:bg-white selection:text-black flex h-14 w-full min-w-0 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white transition-all outline-none disabled:pointer-events-none disabled:opacity-50",
        "focus:border-white/20 focus:bg-white/[0.07]",
        "aria-invalid:border-red-500/50",
        className,
      )}
      {...props}
    />
  );
}

export { Input };

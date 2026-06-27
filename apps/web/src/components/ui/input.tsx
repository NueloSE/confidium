import { forwardRef } from "react";
import { cn } from "./cn";

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-10 w-full rounded-lg border border-hairline bg-surface-2 px-3 text-sm text-zinc-100 outline-none transition-colors duration-150 ease-out",
        "placeholder:text-zinc-600 hover:border-hairline-strong focus:border-accent/70",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";

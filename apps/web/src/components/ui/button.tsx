import { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "./cn";

const buttonVariants = cva(
  "inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium transition-[color,background-color,border-color,box-shadow,transform] duration-150 ease-out focus-visible:outline-none active:translate-y-px disabled:pointer-events-none disabled:opacity-40",
  {
    variants: {
      variant: {
        // The single primary action on a surface — brand amber.
        primary:
          "bg-accent text-accent-fg hover:bg-accent-hover shadow-[0_10px_30px_-12px_rgba(124,92,255,0.7)]",
        // Reserved for "revealed / confirmed" confidential moments.
        success: "bg-success text-black hover:brightness-105",
        // Quiet secondary fill.
        secondary:
          "border border-hairline-strong bg-white/3 text-zinc-100 hover:bg-white/7",
        outline:
          "border border-hairline text-zinc-200 hover:border-hairline-strong hover:bg-white/4",
        ghost: "text-zinc-300 hover:bg-white/6 hover:text-zinc-100",
        warn: "bg-warn text-black hover:brightness-105",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4 text-sm",
        lg: "h-11 px-5 text-sm",
        icon: "h-9 w-9 p-0",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  ),
);
Button.displayName = "Button";

export { buttonVariants };

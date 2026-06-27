import { cn } from "./cn";

/** Elevated surface with a hairline border. The default container for content. */
export function Card({
  className,
  interactive = false,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { interactive?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-hairline bg-surface",
        interactive &&
          "transition-[border-color,background-color,transform] duration-200 ease-out hover:border-hairline-strong hover:bg-elevated",
        className,
      )}
      {...props}
    />
  );
}

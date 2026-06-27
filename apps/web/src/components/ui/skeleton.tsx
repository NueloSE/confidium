import { cn } from "./cn";

/** Shimmering placeholder. Match the shape of the content it stands in for. */
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("shimmer rounded-md bg-white/4", className)} {...props} />;
}

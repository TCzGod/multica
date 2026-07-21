import { forwardRef, useState, type HTMLAttributes } from "react";
import { cn, getInitials } from "@/lib/utils";

export interface AvatarProps extends HTMLAttributes<HTMLSpanElement> {
  src?: string | null;
  name?: string | null;
  size?: "sm" | "md" | "lg";
}

const sizeMap = {
  sm: "h-6 w-6 text-[10px]",
  md: "h-8 w-8 text-xs",
  lg: "h-10 w-10 text-sm",
};

export const Avatar = forwardRef<HTMLSpanElement, AvatarProps>(
  ({ src, name, size = "md", className, ...props }, ref) => {
    const [errored, setErrored] = useState(false);
    const showImg = src && !errored;
    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted font-medium text-subtext",
          sizeMap[size],
          className,
        )}
        {...props}
      >
        {showImg ? (
          <img
            src={src}
            alt={name || "avatar"}
            className="h-full w-full object-cover"
            onError={() => setErrored(true)}
          />
        ) : (
          <span aria-hidden>{getInitials(name)}</span>
        )}
      </span>
    );
  },
);
Avatar.displayName = "Avatar";

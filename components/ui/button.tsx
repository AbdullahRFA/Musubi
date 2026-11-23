import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap gap-2 rounded-lg font-medium transition-all duration-200 ease-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 min-h-tap active:scale-[0.98]",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-[#7c2d12] shadow-sm hover:shadow-glow",
        secondary: "bg-secondary text-secondary-foreground hover:bg-[#32402e] shadow-sm hover:shadow-md",
        outline: "border-2 border-border bg-card hover:bg-muted hover:border-primary/30 text-foreground",
        destructive: "bg-destructive text-destructive-foreground hover:bg-[#850e2e] shadow-sm",
        ghost: "hover:bg-muted hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline min-h-0 p-0",
        accent: "bg-accent text-accent-foreground hover:bg-[#dfcbaf] border border-border",
      },
      size: {
        default: "min-h-[48px] px-5 py-3 text-base",
        sm: "min-h-[40px] px-3.5 py-2 text-sm",
        lg: "min-h-[56px] px-7 py-4 text-lg font-semibold",
        icon: "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };

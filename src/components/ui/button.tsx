import React from 'react';
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-full font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-red-500 text-white hover:bg-red-600 shadow-sm hover:shadow focus:shadow-md",
        outline:
          "border border-red-400 text-red-600 hover:bg-red-50",
        link: "underline-offset-4 text-red-600 hover:underline",
        destructive:
          "bg-red-600 text-white hover:bg-red-700 shadow-sm hover:shadow",
        secondary:
          "bg-slate-900 text-white hover:bg-slate-800 ",
        ghost:
          "bg-transparent text-slate-700 hover:bg-slate-100 ",
        // New neutral soft variant
        soft:
          "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200",
      },
      size: {
        default: "h-10 px-5",
        sm: "h-9 px-4",
        lg: "h-11 px-6",
        icon: "h-10 w-10 p-0 rounded-full",
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
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { buttonVariants };
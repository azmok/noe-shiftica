import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import clsx from "clsx";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  href?: string;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = "primary", size = "md", href, children, ...props },
    ref,
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center rounded-full font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#050505] disabled:opacity-50 disabled:pointer-events-none";

    // Using inline styles/raw classes corresponding to Palette B for now
    // a:hover のグローバルスタイルを上書きしつつ、自身のホバー反転をTailwindで定義
    const variants = {
      primary:
        "bg-[#050505] text-[#FFFFFF] border border-[#FFFFFF] hover:!bg-[#FFFFFF] hover:!text-[#050505] focus:ring-[#FFFFFF]",
      secondary:
        "bg-[#555555] text-white hover:!bg-white hover:!text-[#050505] focus:ring-[#555555]",
      outline:
        "border-2 border-[#FFFFFF] text-[#FFFFFF] hover:!bg-[#FFFFFF] hover:!text-[#050505] focus:ring-[#FFFFFF]",
      ghost:
        "text-white hover:!bg-white hover:!text-[#050505] focus:ring-white",
    };

    const sizes = {
      sm: "h-9 px-4 text-xs",
      md: "h-12 px-8 text-base",
      lg: "h-14 px-10 text-lg",
    };

    const combinedClasses = clsx(
      baseStyles,
      variants[variant],
      sizes[size],
      "hover-lift",
      className,
    );

    if (href) {
      return (
        <Link href={href} className={combinedClasses}>
          {children}
        </Link>
      );
    }

    return (
      <button ref={ref} className={combinedClasses} {...props}>
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";

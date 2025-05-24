"use client";

import React from 'react';
import { cn } from "@/lib/utils";

export interface GradientTextProps {
  text: string;
  className?: string;
  from?: string;
  to?: string;
  animate?: boolean;
  children?: React.ReactNode;
}

export const GradientText: React.FC<GradientTextProps> = ({
  text,
  className = "",
  from = "from-blue-500",
  to = "to-purple-500",
  animate = false,
  children
}) => {
  const content = children || text;
  
  return (
    <span
      className={cn(
        "bg-clip-text text-transparent bg-gradient-to-r",
        from,
        to,
        animate && "animate-gradient-x bg-size-200",
        className
      )}
    >
      {content}
    </span>
  );
}; 
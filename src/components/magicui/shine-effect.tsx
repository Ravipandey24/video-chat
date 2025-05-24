"use client";

import React from 'react';
import { cn } from "@/lib/utils";

export interface ShineEffectProps {
  children: React.ReactNode;
  className?: string;
  shine?: boolean;
  shimmerColor?: string;
}

export const ShineEffect: React.FC<ShineEffectProps> = ({
  children,
  className = "",
  shine = true,
  shimmerColor = "white"
}) => {
  return (
    <div className={cn("group relative overflow-hidden", className)}>
      {shine && (
        <div
          className="absolute inset-0 z-10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"
          style={{
            background: `linear-gradient(90deg, transparent, ${shimmerColor}26, transparent)`,
            transformOrigin: "left"
          }}
        />
      )}
      {children}
    </div>
  );
}; 
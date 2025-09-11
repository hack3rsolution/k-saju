"use client";
import React from "react";

export interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  align?: "left" | "center" | "right";
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  align = "left",
  className = "",
}) => {
  const alignClass =
    align === "center" ? "text-center" : align === "right" ? "text-right" : "text-left";
  return (
    <div className={["space-y-2", alignClass, className].filter(Boolean).join(" ")}>
      <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
      {subtitle && <p className="text-gray-600">{subtitle}</p>}
    </div>
  );
};

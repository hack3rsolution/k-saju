"use client";
import React from "react";

type Padding = "none" | "sm" | "md" | "lg";
type Shadow = "none" | "sm" | "md" | "lg";

const paddingMap: Record<Padding,string> = {
  none: "p-0",
  sm: "p-3",
  md: "p-4",
  lg: "p-6",
};
const shadowMap: Record<Shadow,string> = {
  none: "",
  sm: "shadow-sm",
  md: "shadow-md",
  lg: "shadow-lg",
};

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: Padding;
  shadow?: Shadow;
  className?: string;
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  padding = "md",
  shadow = "sm",
  className = "",
  children,
  ...rest
}) => {
  return (
    <div
      className={[
        "rounded-lg bg-white border border-gray-100",
        paddingMap[padding],
        shadowMap[shadow],
        className,
      ].filter(Boolean).join(" ")}
      {...rest}
    >
      {children}
    </div>
  );
};

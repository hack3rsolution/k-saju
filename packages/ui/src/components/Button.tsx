"use client";
import React from 'react';

export interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  onPress?: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  onPress,
  variant = 'primary',
  disabled = false,
  className = '',
  style,
}) => {
  const handlePress = () => {
    if (onClick) onClick();
    if (onPress) onPress();
  };

  return (
    <button
      onClick={disabled ? undefined : handlePress}
      className={className}
      style={style}
      disabled={disabled}
    >
      {children}
    </button>
  );
};
